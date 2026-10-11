const bcrypt = require("bcryptjs");
const pool = require("../config/database");


// ====================================================
// GET ALL SERVICE PROVIDERS
// ====================================================
const getServiceProviders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.name,
        a.authority_type,
        a.contact_person,
        a.contact_email,
        a.contact_phone,
        a.address,
        a.is_active,
        a.created_at,
        a.updated_at,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categories,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', u.id,
              'fullName', u.full_name,
              'email', u.email,
              'phone', u.phone,
              'isActive', u.is_active
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS accounts

      FROM authorities a

      LEFT JOIN LATERAL (
        SELECT DISTINCT c2.id, c2.name
        FROM categories c2
        WHERE c2.id IN (
          SELECT pt.category_id
          FROM problem_types pt
          WHERE pt.authority_id = a.id
            AND pt.active = TRUE
          UNION
          SELECT rr.category_id
          FROM routing_rules rr
          WHERE rr.authority_id = a.id
            AND rr.active = TRUE
        )
      ) c ON TRUE

      LEFT JOIN users u
        ON u.authority_id = a.id
        AND u.role = 'service_provider'

      GROUP BY a.id
      ORDER BY a.name ASC
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Get service providers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve departments"
    });
  }
};


// ====================================================
// GET ONE SERVICE PROVIDER
// ====================================================
const getServiceProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.name,
        a.authority_type,
        a.contact_person,
        a.contact_email,
        a.contact_phone,
        a.address,
        a.is_active,
        a.created_at,
        a.updated_at,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categories,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', u.id,
              'fullName', u.full_name,
              'email', u.email,
              'phone', u.phone,
              'isActive', u.is_active
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS accounts

      FROM authorities a

      LEFT JOIN LATERAL (
        SELECT DISTINCT c2.id, c2.name
        FROM categories c2
        WHERE c2.id IN (
          SELECT pt.category_id
          FROM problem_types pt
          WHERE pt.authority_id = a.id
            AND pt.active = TRUE
          UNION
          SELECT rr.category_id
          FROM routing_rules rr
          WHERE rr.authority_id = a.id
            AND rr.active = TRUE
        )
      ) c ON TRUE

      LEFT JOIN users u
        ON u.authority_id = a.id
        AND u.role = 'service_provider'

      WHERE a.id = $1

      GROUP BY a.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Get service provider error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve department"
    });
  }
};


// ====================================================
// CREATE NEW SERVICE PROVIDER
// Future expansion beyond existing six units
// ====================================================
const createServiceProvider = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      authorityType,
      contactPerson,
      contactEmail,
      contactPhone,
      address,
      categoryIds = []
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Department name is required"
      });
    }

    await client.query("BEGIN");

    const authorityResult = await client.query(
      `
      INSERT INTO authorities (
        name,
        authority_type,
        contact_person,
        contact_email,
        contact_phone,
        address,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING *
      `,
      [
        name.trim(),
        authorityType || null,
        contactPerson || null,
        contactEmail
          ? contactEmail.toLowerCase().trim()
          : null,
        contactPhone || null,
        address || null
      ]
    );

    const authority = authorityResult.rows[0];

    if (Array.isArray(categoryIds)) {
      for (const categoryId of categoryIds) {
        await client.query(
          `
          UPDATE routing_rules
          SET active = FALSE
          WHERE category_id = $1
          `,
          [categoryId]
        );

        await client.query(
          `
          INSERT INTO routing_rules (
            category_id,
            authority_id,
            active
          )
          VALUES ($1, $2, TRUE)

          ON CONFLICT (
            category_id,
            authority_id
          )
          DO UPDATE SET active = TRUE
          `,
          [categoryId, authority.id]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: authority
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create service provider error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create department"
    });

  } finally {
    client.release();
  }
};


// ====================================================
// UPDATE SERVICE PROVIDER DETAILS
// ====================================================
const updateServiceProvider = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      name,
      authorityType,
      contactPerson,
      contactEmail,
      contactPhone,
      address,
      categoryIds
    } = req.body;

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT *
      FROM authorities
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    const current = existing.rows[0];

    const result = await client.query(
      `
      UPDATE authorities
      SET
        name = $1,
        authority_type = $2,
        contact_person = $3,
        contact_email = $4,
        contact_phone = $5,
        address = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        name !== undefined
          ? name.trim()
          : current.name,

        authorityType !== undefined
          ? authorityType
          : current.authority_type,

        contactPerson !== undefined
          ? contactPerson
          : current.contact_person,

        contactEmail !== undefined
          ? (
              contactEmail
                ? contactEmail.toLowerCase().trim()
                : null
            )
          : current.contact_email,

        contactPhone !== undefined
          ? contactPhone
          : current.contact_phone,

        address !== undefined
          ? address
          : current.address,

        id
      ]
    );

    /*
     * If categories are supplied,
     * Super Admin is redefining this provider's
     * responsibilities.
     */
    if (Array.isArray(categoryIds)) {
      await client.query(
        `
        UPDATE routing_rules
        SET active = FALSE
        WHERE authority_id = $1
        `,
        [id]
      );

      for (const categoryId of categoryIds) {
        /*
         * One primary active provider per category.
         */
        await client.query(
          `
          UPDATE routing_rules
          SET active = FALSE
          WHERE category_id = $1
          `,
          [categoryId]
        );

        await client.query(
          `
          INSERT INTO routing_rules (
            category_id,
            authority_id,
            active
          )
          VALUES ($1, $2, TRUE)

          ON CONFLICT (
            category_id,
            authority_id
          )
          DO UPDATE SET active = TRUE
          `,
          [categoryId, id]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update service provider error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update department"
    });

  } finally {
    client.release();
  }
};


// ====================================================
// CREATE / UPDATE SERVICE PROVIDER LOGIN
// One primary login account per provider for prototype
// ====================================================
const saveServiceProviderAccount = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      fullName,
      email,
      phone,
      password
    } = req.body;

    await client.query("BEGIN");

    const authorityResult = await client.query(
      `
      SELECT id, name, is_active
      FROM authorities
      WHERE id = $1
      `,
      [id]
    );

    if (authorityResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    const existingAccount = await client.query(
      `
      SELECT *
      FROM users
      WHERE authority_id = $1
        AND role = 'service_provider'
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [id]
    );

    /*
     * CREATE ACCOUNT
     */
    if (existingAccount.rows.length === 0) {
      if (!fullName || !email || !password) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Full name, email and password are required when creating a department account"
        });
      }

      if (password.length < 6) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Password must contain at least 6 characters"
        });
      }

      const emailExists = await client.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [email]
      );

      if (emailExists.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: "Email is already used by another account"
        });
      }

      const passwordHash =
        await bcrypt.hash(password, 12);

      const created = await client.query(
        `
        INSERT INTO users (
          full_name,
          phone,
          email,
          password_hash,
          role,
          authority_id,
          is_active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'service_provider',
          $5,
          TRUE
        )

        RETURNING
          id,
          full_name,
          phone,
          email,
          role,
          authority_id,
          is_active,
          created_at
        `,
        [
          fullName.trim(),
          phone || null,
          email.toLowerCase().trim(),
          passwordHash,
          id
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message:
          "Department login account created successfully",
        data: created.rows[0]
      });
    }

    /*
     * UPDATE EXISTING ACCOUNT
     */
    const current = existingAccount.rows[0];

    if (email) {
      const emailExists = await client.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
          AND id <> $2
        LIMIT 1
        `,
        [email, current.id]
      );

      if (emailExists.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: "Email is already used by another account"
        });
      }
    }

    let passwordHash = current.password_hash;

    if (password) {
      if (password.length < 6) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Password must contain at least 6 characters"
        });
      }

      passwordHash =
        await bcrypt.hash(password, 12);
    }

    const updated = await client.query(
      `
      UPDATE users
      SET
        full_name = $1,
        phone = $2,
        email = $3,
        password_hash = $4,
        authority_id = $5,
        role = 'service_provider',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6

      RETURNING
        id,
        full_name,
        phone,
        email,
        role,
        authority_id,
        is_active,
        updated_at
      `,
      [
        fullName !== undefined
          ? fullName.trim()
          : current.full_name,

        phone !== undefined
          ? phone
          : current.phone,

        email !== undefined
          ? email.toLowerCase().trim()
          : current.email,

        passwordHash,
        id,
        current.id
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        "Department login account updated successfully",
      data: updated.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Save service provider account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save department login account"
    });

  } finally {
    client.release();
  }
};


// ====================================================
// ACTIVATE / DEACTIVATE PROVIDER
// ====================================================
const updateServiceProviderStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false"
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE authorities
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    /*
     * Disable/enable linked provider accounts too.
     */
    await client.query(
      `
      UPDATE users
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE authority_id = $2
        AND role = 'service_provider'
      `,
      [isActive, id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Department activated successfully"
        : "Department deactivated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update service provider status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update department status"
    });

  } finally {
    client.release();
  }
};


module.exports = {
  getServiceProviders,
  getServiceProviderById,
  createServiceProvider,
  updateServiceProvider,
  saveServiceProviderAccount,
  updateServiceProviderStatus
};
