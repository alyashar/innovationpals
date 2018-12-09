const mongoose = require('mongoose');

module.exports = function(req, res, next) {
    if (req.params && req.params.id) {
        let isIdValid = /[a-f0-9]{24}/.test(req.params.id) || mongoose.Types.ObjectId.isValid(req.params.id)
        if (isIdValid) {
            next()
        } else {
            res.status(422).json({
                success: false,
                error: "id should be valid"
            })
        }
    } else {
        next()
    }
}

// mongoose.Types.ObjectId.isValid(req.params.id)
// ( /[a-f0-9]{24}/.test(req.params.id) )