const User = require("../../models/user")


const getUser = async (req, res) => {
    const { user_token } = req.params;
    console.log(user_token)
    let thisUser = await User.findOne({ jwtToken: user_token });
    return res.status(200).json({ success: true, thisUser });
}


module.exports = {
    getUser
};
