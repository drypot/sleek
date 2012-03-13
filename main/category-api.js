
ex.post('/api/get-category', assertLoggedIn, function (req, res) {
	var role = role$.getByName(req.session.roleName);
	res.json(role && role.category);
});

