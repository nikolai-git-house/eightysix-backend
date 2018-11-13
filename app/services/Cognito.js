const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const aws = require('aws-sdk');
const config = require('../../config');
global.fetch = require('node-fetch');

aws.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey
});

class Cognito {
  static async deleteUser(email, userSub) {
    return new Promise((resolve, reject) => {
      let {CognitoIdentityServiceProvider} = aws;
      let client = new CognitoIdentityServiceProvider({
        apiVersion: '2016-04-19',
        region: config.cognito.region
      });
      let params = {
        UserPoolId: config.cognito.userPoolId,
        Username: userSub
      };
      client.adminDeleteUser(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Forgot Password for user.
   *
   * @param email
   */
  static async forgotPassword(email) {
    let poolData = {
      UserPoolId: config.cognito.userPoolId,
      ClientId: config.cognito.userPoolWebClientId
    };
    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    let userData = {
      Username: email,
      Pool: userPool
    };
    let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess(data) {
          resolve(data);
        },
        onFailure(err) {
          reject(err);
        },
        inputVerificationCode(data) {
          resolve(data);
        }
      });
    });
  }

  /**
   * Confirm New Password
   *
   * @param email
   */
  static async confirmPassword(email, newPassword, verificationCode) {
    let poolData = {
      UserPoolId: config.cognito.userPoolId,
      ClientId: config.cognito.userPoolWebClientId
    };
    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    let userData = {
      Username: email,
      Pool: userPool
    };
    let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(verificationCode, newPassword, {
        onSuccess() {
          resolve('Password confirmed!');
        },
        onFailure(err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Sign Out
   *
   * @param email
   */

  static async signOut(email) {
    let poolData = {
      UserPoolId: config.cognito.userPoolId,
      ClientId: config.cognito.userPoolWebClientId
    };
    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    let userData = {
      Username: email,
      Pool: userPool
    };
    let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    return new Promise(resolve => {
      cognitoUser.signOut();
      resolve(true);
    });
  }

  /**
   * Sign Up user verification
   *
   * @param email
   */

  static async signUpVerification(email, verificationCode) {
    let poolData = {
      UserPoolId: config.cognito.userPoolId,
      ClientId: config.cognito.userPoolWebClientId
    };
    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    let userData = {
      Username: email,
      Pool: userPool
    };
    let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * Sign Up user to Cognito User Pool
   *
   * @param email
   */
  static async signUp(signUpData) {
    let poolData = {
      UserPoolId: config.cognito.userPoolId,
      ClientId: config.cognito.userPoolWebClientId
    };

    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    let attributeList = [];

    let dataEmail = {
      Name: 'email',
      Value: signUpData.email
    };

    let dataPhoneNumber = {
      Name: 'phone_number',
      Value: signUpData.phone
    };

    let dataName = {
      Name: 'name',
      Value: signUpData.name
    };

    let attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    let attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhoneNumber);
    let attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);

    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);
    attributeList.push(attributeName);

    return new Promise((resolve, reject) => {
      userPool.signUp(
        signUpData.email,
        signUpData.password,
        attributeList,
        null,
        (err, result) => {
          if (err) {
            reject(err);
          }
          if (result) {
            let {CognitoIdentityServiceProvider} = aws;
            let client = new CognitoIdentityServiceProvider({
              apiVersion: '2016-04-19',
              region: config.cognito.region
            });
            let params = {
              GroupName: 'supplier',
              UserPoolId: config.cognito.userPoolId,
              Username: result.userSub
            };
            client.adminAddUserToGroup(params, async error => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
          }
        }
      );
    });
  }

  /**
   * Sign In to Cognito User Pool
   *
   * @param email
   */

  static async signIn(authenticationData) {
    let authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: authenticationData.email,
      Password: authenticationData.password
    });
    let poolData = {
      UserPoolId: config.cognito.userPoolId,
      ClientId: config.cognito.userPoolWebClientId
    };
    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    let userData = {
      Username: authenticationData.email,
      Pool: userPool
    };
    let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess(result) {
          resolve({
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.idToken.jwtToken
          });
        },
        onFailure(err) {
          reject(err);
        }
      });
    });
  }
}

module.exports = {Cognito};
