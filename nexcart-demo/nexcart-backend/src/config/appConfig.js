import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  port: process.env.PORT || 4000,
  env: process.env.APP_ENV || "local",

  mongodbUri: process.env.MONGODB_URI || "",

  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  authProvider: process.env.AUTH_PROVIDER || "local",

  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    useS3: process.env.AWS_USE_S3 === "true",
    useSns: process.env.AWS_USE_SNS === "true",
    useCloudWatch: process.env.AWS_USE_CLOUDWATCH === "true",
    useCognito: process.env.AWS_USE_COGNITO === "true",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
    snsTopicArn: process.env.AWS_SNS_TOPIC_ARN || "",
    cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID || "",
    cognitoClientId: process.env.AWS_COGNITO_CLIENT_ID || ""
  }
};