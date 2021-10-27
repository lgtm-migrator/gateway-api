const checkIDMiddleware = (req, res, next) => {

	const { id } = req.params;

	if (!id) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a dataset identifier',
		});
	}

	next();
}

export { checkIDMiddleware }