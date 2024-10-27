const User = require("../models/User")
const generateToken = require("../utils/jwt"); // Add this line
const bcrypt = require("bcryptjs");









exports.createUser = async (req, res) => {
	const { username, password, isAdmin } = req.body;
	console.log("Request Body: ", req.body); // Debugging

	try {
		const user = new User({ username, password, isAdmin });
		await user.save();
		res.status(201).json(user);
	} catch (err) {
		console.error("Error creating user:", err.message); // More detailed error
		res.status(400).json({
			msg: "Error creating user",
			error: err.message,
		});
	}
};



// Get all users

exports.getAllUsers = async (req,res) => {
    try{
        const users = await User.find().select("-password");
        res.json(users)
		console.log(users)

    } catch(err) {
        res.status(500).json({
			msg: "Error fetching users",
			error: err.message,
		});
    }
}




// Get single user


exports.getUser = async(req, res) => {
     try {
			const user = await User.findById(req.params.id).select("-password");
			if (!user) return res.status(404).json({ msg: "User not found" });
			res.json(user);
			console.log(user)
		} catch (err) {
			res.status(500).json({
				msg: "Error fetching user",
				error: err.message,
			});
		}
};





// Update user


exports.updateUser = async (req, res) => {
	try {
		// Check if the password is being updated
		if (req.body.password) {
			const salt = await bcrypt.genSalt(10); // Generate salt
			req.body.password = await bcrypt.hash(req.body.password, salt); // Hash the password
		}

		// Update the user
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		).select("-password");

		if (!updatedUser) {
			return res.status(404).json({ msg: "User not found" });
		}

		res.json(updatedUser);
		console.log(updatedUser)
	} catch (err) {
		res.status(500).json({
			msg: "Error updating user",
			error: err.message,
		});
	}
};


// Delete user



exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ msg: 'User deleted' });
		console.log(`user ${user} deleted`)
    } catch (err) {
        res.status(500).json({ msg: 'Error deleting user', error: err.message });
    }
};




//login User

exports.loginUser = async (req, res) => {
	const { username, password } = req.body;

	try {
		const user = await User.findOne({ username });

		if (!user || !(await user.matchPassword(password))) {
			return res
				.status(401)
				.json({ msg: "Invalid username or password" });
		}

		const token = generateToken(user._id);
		res.json({ token });
		
			
	} catch (err) {
		res.status(500).json({
			msg: "Error logging in",
			error: err.message,
		});
	}
};

