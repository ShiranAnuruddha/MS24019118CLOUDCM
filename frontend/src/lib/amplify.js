import { Amplify } from "aws-amplify";

export const amplifyEnabled =
  !!import.meta.env.VITE_AWS_REGION &&
  !!import.meta.env.VITE_COGNITO_USER_POOL_ID &&
  !!import.meta.env.VITE_COGNITO_CLIENT_ID;

if (amplifyEnabled) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        loginWith: {
          email: import.meta.env.VITE_COGNITO_LOGIN_WITH_EMAIL !== "false",
          username: false,
        },
      },
    },
  });
}
