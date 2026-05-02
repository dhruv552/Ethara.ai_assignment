/**
 * Wraps async route handlers to catch promise rejections and pass them to Express error handler
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
