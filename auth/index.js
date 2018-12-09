const jwt = require('jsonwebtoken');
const fs = require('fs');
const request = require('request');

const AppConfig = require("../constants/appConfig")
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const User = require('../model/user');

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

// Verify Authorization Header is exist or not
module.exports.verifyToken = function (req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        // Next middleware
        next();
    } else {
        // Forbidden
        return res.status(403).json({ success: false, error: msg.authFail });
    }
}

// Verify Token is Valid Or Not
module.exports.isTokenValid = function (req, res, next) {
    console.log("isTokenValid");
    jwt.verify(req.token, AppConfig.JWT_AUTHTOKEN_SECRET, (err, authData) => {
        if (err || !authData) {
            return res.status(401).json({ success: false, error: msg.authFail });
        } else {
            User.getUserByIdPassword(authData._id, authData.password, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({ success: false, error: msg.authFail });
                } else {
                    req.authData = authData;
                    req.authUser = user;
                    next();
                }
            })
        }
    })
}

// Verify User is Super-Admin
module.exports.isSuperAdmin = function (req, res, next) {
    console.log("isSuperAdmin");
    let isSuperAdmin = req.authData.role_id._id.toString() === SUPER_ADMIN_ID
    if (isSuperAdmin) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Admin
module.exports.isAdmin = function (req, res, next) {
    console.log("isAdmin");
    let isAdmin = req.authData.role_id._id.toString() === ADMIN_ID
    if (isAdmin) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Super-Admin Or Admin
module.exports.isSuperAdminOrAdmin = function (req, res, next) {
    console.log("isSuperAdminOrAdmin");
    let isSuperAdminOrAdmin = req.authData.role_id._id.toString() === SUPER_ADMIN_ID || req.authData.role_id._id.toString() === ADMIN_ID
    if (isSuperAdminOrAdmin) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Super-Admin Or Admin
module.exports.isSuperAdminOrAdminOrStudent = function (req, res, next) {
    console.log("isSuperAdminOrAdminOrStudent");
    let isSuperAdminOrAdminOrStudent = req.authData.role_id._id.toString() === SUPER_ADMIN_ID || req.authData.role_id._id.toString() === ADMIN_ID || req.authData.role_id._id.toString() === STUDENT_ID
    if (isSuperAdminOrAdminOrStudent) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Student
module.exports.isStudent = function (req, res, next) {
    console.log("isStudent");
    let isStudent = req.authData.role_id._id.toString() === STUDENT_ID
    if (isStudent) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Visitors
module.exports.isVisitor = function (req, res, next) {
    console.log("isVisitor");
    let isVisitor = req.authData.role_id._id.toString() === VISITOR_ID
    if (isVisitor) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Visitors or Student
module.exports.isStudentOrVisitor = function (req, res, next) {
    console.log("isStudentOrVisitor");
    let isStudentOrVisitor = req.authData.role_id._id.toString() === VISITOR_ID || req.authData.role_id._id.toString() === STUDENT_ID
    if (isStudentOrVisitor) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Admin or Student or Visitor
module.exports.isAdminOrStudentorVisitor = function (req, res, next) {
    console.log("isAdminOrStudentorVisitor");
    let isAdminOrStudentorVisitor = req.authData.role_id._id.toString() === SUPER_ADMIN_ID || req.authData.role_id._id.toString() === ADMIN_ID || req.authData.role_id._id.toString() === STUDENT_ID || req.authData.role_id._id.toString() === VISITOR_ID;
    if (isAdminOrStudentorVisitor) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User is Active
module.exports.isActive = function (req, res, next) {
    console.log("isActive");
    if (req.authUser.status === false) {
        return res.status(401).json({ success: false, error: msg.authFail });
    } else {
        if (req.authData.status) {
            next();
        } else {
            return res.status(401).json({ success: false, error: msg.authFail });
        }
    }
}

// Verify User is Deleted
module.exports.isDeleted = function (req, res, next) {
    console.log("isDeleted");
    if (req.authUser.is_deleted) {
        return res.status(401).json({ success: false, error: msg.authFail });
    } else {
        if (req.authData.is_deleted) {
            return res.status(401).json({ success: false, error: msg.authFail });
        } else {
            next();
        }
    }
}

// Verify User By Organization
module.exports.isUserOrganizationValid = function (req, res, next) {
    console.log("isUserOrganizationValid");
    if (req.isUserMasterAdmin) {
        next();
    } else if (!req.isUserMasterAdmin && req.authUser.organization_id._id.toString() === req.authData.organization_id.toString()) {
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Verify User By Role
module.exports.isUserValidByRole = function (req, res, next) {
    console.log("isUserValidByRole");
    if (req.authData.role_id && req.authUser.role_id &&
        req.authUser.role_id._id.toString() === req.authData.role_id._id.toString()) {
        req.isUserMasterAdmin = req.authData.role_id._id.toString() === SUPER_ADMIN_ID
        next();
    } else {
        return res.status(401).json({ success: false, error: msg.authFail });
    }
}

// Generate Imgur Access Token
function generateImgurAccessToken() {
    return new Promise(function (resolve) {
        var url = AppConfig.IMGUR_GENERATE_ACCESS_TOKEN_URL;
        request({
            url: url,
            method: "post",
            json: true,
            headers: {},
            body: {
                "refresh_token": AppConfig.IMGUR_REFRESH_TOKEN,
                "client_id": AppConfig.IMGUR_CLIENT_ID,
                "client_secret": AppConfig.IMGUR_CLIENT_SECRET,
                "grant_type": AppConfig.IMGUR_GRANT_TYPE
            }
        }, function (err, response, body) {
            if (err) {
                resolve(false);
            } else {
                if (body.access_token) {
                    console.log('body.access_token', body.access_token);
                    resolve(body.access_token);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

// Imgur Procees Image
function processImage(image, album, access_token) {
    var image = image;
    var album = album;
    var url = AppConfig.IMGUR_UPLOAD_IMAGE_URL;
    var auth = "Bearer " + access_token;
    let request_body = {
        url: url,
        method: 'post',
        json: true,
        headers: {
            'Content-Type': 'application/json',
            "Authorization": auth,
        },
        body: { 'image': image }
    };
    return new Promise(function (resolve) {
        request(request_body, function (err, response, body) {
            if (err) {
                console.log('Imgur ERROR', err);
                resolve(false);
            } else {
                if (body.success) {
                    console.log('body.data.link', body.data.link);
                    let obj = { image_link: body.data.link, imgur_token: access_token };
                    resolve(obj);
                } else {
                    console.log('Imgur ERROR');
                    resolve(false);
                }
            }
        });
    });
}

// Uplaod Image to the Imgur Server and Get Image URL
function getImageURLFromImgure(image, album, imgur_token_flag, imgur_token) {
    return new Promise(function (resolve) {
        var access_token = '';
        if (!imgur_token_flag) {
            generateImgurAccessToken().then(function (access_token) {
                processImage(image, album, access_token).then(function (response) {
                    resolve(response);
                });
            });
        } else {
            access_token = imgur_token;
            processImage(image, album, access_token).then(function (response) {
                resolve(response);
            });
        }
    });
}

module.exports.getImageURL = function (req, image, album) {
    return new Promise(function (resolve) {
        console.log('getImageURL Called');
        var sess = req.session;
        let imgur_token = '';
        var imgur_token_flag = false;

        /*
        if (sess.imgur_token) {
            imgur_token_flag = true;
            imgur_token = sess.imgur_token;
        }
        */

        getImageURLFromImgure(image, album, imgur_token_flag, imgur_token).then(function (response_imgure) {
            if (response_imgure) {
                if (response_imgure.imgur_token) {
                    console.log('TOKEN SET');
                    //sess.imgur_token = response_imgure.imgur_token;
                    let image_link = response_imgure.image_link;
                    resolve(image_link);
                } else {
                    resolve(false);
                    console.log('TOKEN ALEADY  SET');
                }
            } else {
                resolve(false);
            }
        });
    });
}