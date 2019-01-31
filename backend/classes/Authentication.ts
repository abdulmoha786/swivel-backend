import { IAuthentication } from "../interfaces/IAuthentication";
import { ActivityResponse } from "../models/ActivityResponse";
const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
import moment = require('moment');
import sql = require('mssql');
import passHash = require('password-hash');
import { resolve } from "url";

export class Authentication implements IAuthentication {
    validateLogin(user: string, password: string) {
        const loginSchema = Joi.object().keys({
            user: Joi.alternatives([Joi.string().max(255).email({ minDomainAtoms: 2 }).required(),
            Joi.string().min(10).max(15).regex(/[0-9]/).required()]),
            password: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        });
        const result = Joi.validate({ user, password }, loginSchema);
        return result;
    }

    validateRegistration(firstName: string, lastName: string, otherName: string, mobileNumber: string, emailAddress: string, country: string, dateOfBirth: string, gender: string, nationality: string, nationalID: string, password: string, passwordConfirm: string) {
        const registrationSchema = Joi.object().keys({
            firstName: Joi.string().min(3).required().replace(/\s{1,}/g, ''),
            lastName: Joi.string().min(3).required().replace(/\s{1,}/g, ''),
            otherName: Joi.string().min(3).required().replace(/\s{1,}/g, ''),
            mobileNumber: Joi.string().min(10).max(15).regex(/[0-9]/).required().replace(/\s{1,}/g, ''),
            emailAddress: Joi.string().max(255).email({ minDomainAtoms: 2 }).required(),
            country: Joi.string().required().replace(/\s{1,}/g, ''),
            dateOfBirth: Joi.date().format('DD-MM-YYYY').required(),
            gender: Joi.string().valid(['M', 'F']).required(),
            nationality: Joi.string().min(3).required().replace(/\s{1,}/g, ''),
            nationalID: Joi.string().length(8).regex(/[0-9]{8}/).required().replace(/\s{1,}/g, ''),
            password: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().replace(/\s{1,}/g, ''),
            passwordConfirm: Joi.string().min(8).valid(Joi.ref('password')).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().replace(/\s{1,}/g, '')
        });
        const result = Joi.validate({ firstName, lastName, otherName, mobileNumber, emailAddress, country, dateOfBirth, gender, nationality, nationalID, password, passwordConfirm }, registrationSchema);
        return result;
    }

    validateForgotPassword(user: string) {
        const forgotPasswordSchema = Joi.object().keys({
            user: Joi.alternatives([Joi.string().max(255).email({ minDomainAtoms: 2 }).required(), Joi.string().min(10).max(15).regex(/[0-9]/).required().replace(/\s{1,}/g, '')]),
        });
        const result = Joi.validate({ user }, forgotPasswordSchema);
        return result;
    }

    validateNewPassword(token: string, password: string, passwordConfirm: string) {
        const newPasswordSchema = Joi.object().keys({
            token: Joi.string().max(255).required().replace(/\s{1,}/g, ''),
            password: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().replace(/\s{1,}/g, ''),
            passwordConfirm: Joi.string().min(8).valid(Joi.ref('password')).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().replace(/\s{1,}/g, '')
        });
        const result = Joi.validate({ token, password, passwordConfirm }, newPasswordSchema);
        return result;
    }

    register(firstName: string, lastName: string, otherName: string, mobileNumber: string, emailAddress: string, country: string, dateOfBirth: string, gender: string, nationality: string, nationalID: string, password: string, passwordConfirm: string): Promise<ActivityResponse> {
        return new Promise<ActivityResponse>((resolve, reject) => {
            let result = this.validateRegistration(firstName.replace(/\s{1,}/g, ''), lastName.replace(/\s{1,}/g, ''), otherName.replace(/\s{1,}/g, ''), mobileNumber.replace(/\s{1,}/g, ''), emailAddress, country.replace(/\s{1,}/g, ''), dateOfBirth, gender, nationality.replace(/\s{1,}/g, ''), nationalID.replace(/\s{1,}/g, ''), password.replace(/\s{1,}/g, ''), passwordConfirm.replace(/\s{1,}/g, ''))
            if (result.error === null) {
//-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
                let query: string = `SELECT * FROM TBCUSTOMERS WHERE (CUSTOMERNO=@mobileNumber)`
                let query1: string = `SELECT * FROM TBCUSTOMERS WHERE (EMAILADDRESS=@emailAddress)`
                let query2: string = `SELECT * FROM TBCUSTOMERS WHERE (IDENTIFICATIONID=@nationalID)`
                let request = new sql.Request();
                request.input('mobileNumber', mobileNumber.replace(/\s{1,}/g, ''))
                request.input('emailAddress', emailAddress.replace(/\s{1,}/g, ''))
                request.input('nationalID', nationalID.replace(/\s{1,}/g, ''))
                request.query(query).then((res) => {
                    request.query(query1).then((res1) => {
                        request.query(query2).then((res2) => {
                            let error_msg: string[] = ['', '', '']
                            let index: number = 0
                            if (res.recordsets[0].length > 0) {
                                let msg = `Mobile Number ${mobileNumber}`
                                error_msg[index] = msg
                                index++;
                            }
                            if (res1.recordsets[0].length > 0) {
                                let msg = `Email Address ${emailAddress}`
                                error_msg[index] = msg
                                index++;
                            }
                            if (res2.recordsets[0].length > 0) {
                                let msg = `ID Number ${nationalID}`
                                error_msg[index] = msg;
                                index++;
                            }
                            if (index === 0) {
                                let DOB: Date = moment(dateOfBirth, 'DD-MM-YYYY').toDate()
                                let passwordHash = passHash.generate(password.replace(/\s{1,}/g, ''))
                                let query: string = `INSERT into [TBCUSTOMERS] ([FIRSTNAME],[LASTNAME],[OTHERNAMES], [CUSTOMERNO],[EMAILADDRESS],[COUNTRY],[DATEOFBIRTH],[GENDER],[NATIONALITY],[IDENTIFICATIONID],[PASSWORD]) 
                                                VALUES(@firstName, @lastName, @otherName, @mobileNumber, @emailAddress, @country, @dateOfBirth, @gender, @nationality, @nationalID, @passwordHash);`
                                let request = new sql.Request();
                                request.input('firstName', firstName.replace(/\s{1,}/g, ''))
                                request.input('lastName', lastName.replace(/\s{1,}/g, ''))
                                request.input('otherName', otherName.replace(/\s{1,}/g, ''))
                                request.input('mobileNumber', mobileNumber.replace(/\s{1,}/g, ''))
                                request.input('emailAddress', emailAddress)
                                request.input('country', country.replace(/\s{1,}/g, ''))
                                request.input('dateOfBirth', DOB)
                                request.input('gender', gender)
                                request.input('nationality', nationality.replace(/\s{1,}/g, ''))
                                request.input('nationalID', nationalID.replace(/\s{1,}/g, ''))
                                request.input('passwordHash', passwordHash)

                                request.query(query);
                                resolve({ type: 'success' });
                            }
                            else {
                                let reason = ''
                                error_msg.forEach((value) => {
                                    if (value) {
                                        reason += value + ', '
                                    }
                                })
                                reject({
                                    type: 'validation-error',
                                    reason: 'User with ' + reason + ' Exist'
                                })
                            }
                        })
                    })
                }).catch(() => reject({
                    type: 'app-crashed',
                    reason: 'Database Connection Error'
                }))
//-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
            }
            else {
                reject({
                    type: 'validation-error',
                    reason: result.error
                })
            }
        })
    }

    login(user: string, password: string): Promise<ActivityResponse> {
        return new Promise<ActivityResponse>((resolve, reject) => {
            let result = this.validateLogin(user, password)
            if (result.error === null) {
                let query: string = `SELECT PASSWORD FROM TBCUSTOMERS WHERE CUSTOMERNO=@user OR EMAILADDRESS=@user`
                let request = new sql.Request();
                request.input('user', user)
                request.query(query).then((res) => {
                    if (res.recordsets[0].length != 0 && passHash.verify(password, res.recordset[0]['PASSWORD'])) {
                        resolve({ type: 'success' })
                    } else {
                        reject({
                            type: 'validation-error',
                            reason: 'Wrong Credentials'
                        })
                    }
                }).catch(() => reject({
                    type: 'app-crashed',
                    reason: 'Database Connection Error'
                }))
            } else {
                reject({
                    type: 'validation-error',
                    reason: result.error
                })
            }
        })
    }

    forgotPassword(user: string): ActivityResponse {
        let result = this.validateForgotPassword(user)
        if (result.error === null) {
            return {
                type: 'success'
            }
        } else {
            return {
                type: 'validation-error',
                reason: result
            }
        }
    }

    newPassword(token: string, password: string, passwordConfirm: string): ActivityResponse {
        let result = this.validateNewPassword(token, password, passwordConfirm)
        if (result.error === null) {
            return {
                type: 'success'
            }
        } else {
            return {
                type: 'validation-error',
                reason: result.error
            }
        }
    }
}