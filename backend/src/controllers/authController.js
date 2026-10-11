const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
};

const register = async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;

    if (!fullName || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: "Full name, password and either email or phone are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters"
      });
    }

    if (email) {
      const existingEmail = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered"
        });
      }
    }

    if (phone) {
      const existingPhone = await pool.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone]
      );

      if (existingPhone.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Phone number is already registered"
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
       (full_name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'citizen')
       RETURNING id, full_name, phone, email, role, created_at`,
      [
        fullName.trim(),
        phone || null,
        email ? email.toLowerCase().trim() : null,
        passwordHash
      ]
    );

    const user = result.rows[0];

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Citizen registered successfully",
      token,
      user
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register user"
    });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/phone and password are required"
      });
    }

    const normalizedPhone = normalizeTanzanianPhone(identifier);
    const localPhone = normalizedPhone ? `0${normalizedPhone.slice(4)}` : null;

    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE LOWER(email) = LOWER($1)
          OR phone = $1
          OR ($2::text IS NOT NULL AND phone = $2)
          OR ($3::text IS NOT NULL AND phone = $3)
       LIMIT 1`,
      [identifier.trim(), normalizedPhone, localPhone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials"
      });
    }

    const user = result.rows[0];

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated"
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials"
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        authorityId: user.authority_id || null,
        isActive: user.is_active !== false
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login"
    });
  }
};


function normalizeTanzanianPhone(value) {
  const raw = String(value || '').replace(/\s+/g, '').replace(/-/g, '');
  if (/^0[67]\d{8}$/.test(raw)) return `+255${raw.slice(1)}`;
  if (/^255[67]\d{8}$/.test(raw)) return `+${raw}`;
  if (/^\+255[67]\d{8}$/.test(raw)) return raw;
  return null;
}

function hashOtp(phone, code) {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${code}:${process.env.JWT_SECRET}`)
    .digest('hex');
}

async function deliverOtp(phone, code) {
  if (process.env.SMS_GATEWAY_URL) {
    const response = await fetch(process.env.SMS_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SMS_GATEWAY_TOKEN
          ? { Authorization: `Bearer ${process.env.SMS_GATEWAY_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        to: phone,
        message: `Your MtaaFix verification code is ${code}. It expires in 5 minutes.`,
      }),
    });
    if (!response.ok) throw new Error('SMS gateway rejected OTP message');
    return { delivered: true, mode: 'sms' };
  }

  console.log(`[MtaaFix DEV OTP] ${phone}: ${code}`);
  return { delivered: false, mode: 'development' };
}

const requestPhoneOtp = async (req, res) => {
  try {
    const phone = normalizeTanzanianPhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Enter a valid Tanzanian mobile number' });
    }

    const localPhone = `0${phone.slice(4)}`;
    const userResult = await pool.query(
      `SELECT id, full_name, phone, email, role, is_active
       FROM users
       WHERE phone IN ($1,$2)
       LIMIT 1`,
      [phone, localPhone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No MtaaFix account is registered with this phone number' });
    }
    const user = userResult.rows[0];
    if (user.is_active === false) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = hashOtp(phone, code);

    await pool.query(
      `UPDATE auth_otp_codes SET consumed_at=CURRENT_TIMESTAMP
       WHERE phone=$1 AND consumed_at IS NULL`,
      [phone]
    );
    await pool.query(
      `INSERT INTO auth_otp_codes (phone, code_hash, purpose, expires_at)
       VALUES ($1,$2,'login',CURRENT_TIMESTAMP + INTERVAL '5 minutes')`,
      [phone, codeHash]
    );

    const delivery = await deliverOtp(phone, code);
    return res.status(200).json({
      success: true,
      message: delivery.delivered
        ? 'Verification code sent to your phone'
        : 'Verification code generated in development mode',
      phone,
      deliveryMode: delivery.mode,
      ...(delivery.mode === 'development' ? { developmentOtp: code } : {}),
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send verification code' });
  }
};

const verifyPhoneOtp = async (req, res) => {
  try {
    const phone = normalizeTanzanianPhone(req.body.phone);
    const code = String(req.body.code || '').trim();
    if (!phone || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'Phone number and 6-digit verification code are required' });
    }

    const otpResult = await pool.query(
      `SELECT id, code_hash
       FROM auth_otp_codes
       WHERE phone=$1 AND purpose='login' AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );
    if (otpResult.rows.length === 0 || otpResult.rows[0].code_hash !== hashOtp(phone, code)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired verification code' });
    }

    await pool.query(`UPDATE auth_otp_codes SET consumed_at=CURRENT_TIMESTAMP WHERE id=$1`, [otpResult.rows[0].id]);

    const localPhone = `0${phone.slice(4)}`;
    const userResult = await pool.query(
      `SELECT * FROM users WHERE phone IN ($1,$2) LIMIT 1`,
      [phone, localPhone]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    const user = userResult.rows[0];
    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      message: 'Phone verification successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        authorityId: user.authority_id || null,
        isActive: user.is_active !== false,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify code' });
  }
};

module.exports = {
  register,
  login,
  requestPhoneOtp,
  verifyPhoneOtp
};
