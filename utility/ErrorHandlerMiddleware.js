module.exports = function(err, req, res, next) {
    res.status(500).send({
        status: false,
        error: "Something Broke"
    })
}