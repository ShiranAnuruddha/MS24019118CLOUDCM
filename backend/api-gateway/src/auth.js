const { CognitoJwtVerifier } = require("aws-jwt-verify");

let verifier;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      tokenUse: "access",
      clientId: process.env.COGNITO_CLIENT_ID,
    });
  }
  return verifier;
}

function buildMockUser(req) {
  return {
    id: req.headers["x-mock-user-id"] || "demo-user-1",
    email: req.headers["x-mock-user-email"] || "demo@hiresphere.local",
    role: req.headers["x-mock-user-role"] || "candidate",
    name: req.headers["x-mock-user-name"] || "Demo User",
  };
}

async function authMiddleware(req, res, next) {
  if (req.path === "/health") {
    return next();
  }

  if (process.env.BYPASS_AUTH === "true") {
    const user = buildMockUser(req);
    req.user = user;
    req.headers["x-user-id"] = user.id;
    req.headers["x-user-email"] = user.email;
    req.headers["x-user-role"] = user.role;
    req.headers["x-user-name"] = user.name;
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const payload = await getVerifier().verify(token);
    const user = {
      id: payload.sub,
      email: payload.email || payload.username || payload["cognito:username"],
      role: payload["custom:profileType"] || "candidate",
      name: payload.name || payload.email || payload["cognito:username"] || payload.sub,
    };
    req.user = user;
    req.headers["x-user-id"] = user.id;
    req.headers["x-user-email"] = user.email;
    req.headers["x-user-role"] = user.role;
    req.headers["x-user-name"] = user.name;
    next();
  } catch (error) {
    console.error("JWT verification failed", error);
    res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { authMiddleware };
