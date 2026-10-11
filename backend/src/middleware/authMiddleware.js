const jwt = require("jsonwebtoken");
const pool = require("../config/database");

async function loadUserFromToken(token) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      phone,
      email,
      role,
      authority_id,
      is_active
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [decoded.id]
  );

  if (result.rows.length === 0) {
    const error = new Error("User no longer exists");
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];

  if (user.is_active === false) {
    const error = new Error("This account has been deactivated");
    error.statusCode = 403;
    throw error;
  }

  return user;
}

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = authHeader.split(" ")[1];
    req.user = await loadUserFromToken(token);
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Invalid or expired token"
    });
  }
};

// Allows public/guest requests while still attaching req.user
// when a valid token is supplied.
const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    req.user = await loadUserFromToken(token);
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Invalid or expired token"
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action"
      });
    }

    next();
  };
};

module.exports = {
  protect,
  optionalProtect,
  authorize
};
