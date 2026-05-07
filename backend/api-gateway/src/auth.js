const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_USER_POOL_CLIENT_ID,
});

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Missing bearer token" });
    }

    const payload = await verifier.verify(token);
    const groups = payload["cognito:groups"] || [];

    req.user = {
      id: payload.sub,
      email: payload.email || "",
      role: groups.includes("interviewer") ? "interviewer" : "candidate",
      name: payload.username || payload.email || "User",
      claims: payload,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware };