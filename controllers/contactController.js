const sanitizeHtml = require("sanitize-html")
const { ObjectId } = require("mongodb")
const petsCollection = require("../db").db().collection("pets")
const nodemailer = require("nodemailer")

const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {}
}

exports.submitContact = async function (req, res) {
  if (req.body.secret.toUpperCase() !== "PUPPY") {
    console.log("spam detected")
    return res.json({ message: "Sorry!" })
  }

  if (!ObjectId.isValid(req.body.petId)) {
    console.log("Invalid id detected")
    return res.json({ message: "Sorry!" })
  }

  const doesPetExist = await petsCollection.findOne({ _id: new ObjectId(req.body.petId) })

  if (!doesPetExist) {
    console.log("Pet does not exist")
    return res.json({ message: "Sorry!" })
  }

  const ourObject = {
    name: sanitizeHtml(req.body.name, sanitizeOptions),
    email: sanitizeHtml(req.body.email, sanitizeOptions),
    comment: sanitizeHtml(req.body.comment, sanitizeOptions)
  }

  console.log(ourObject)

  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAPUSERNAME,
      pass: process.env.MAILTRAPPASSWORD
    }
  })

  transport.sendMail({
    to: ourObject.email,
    from: "petadoption@localhost",
    subject: `Thank you for your interest in ${doesPetExist.name}`,
    html: `<h3 style="color: purple; font-size: 30px; font-weight: normal;">Thank you!</h3>
    <p>We appreciate your interest in ${doesPetExist.name} and one of our staff members will reach out to you shortly! Below is a copy of the message you sent us for your personal records:</p>
    <p><em>${ourObject.comment}</em></p>`
  })

  transport.sendMail({
    to: "petadoption@localhost",
    from: "petadoption@localhost",
    subject: `Someone is interested in ${doesPetExist.name}`,
    html: `<h3 style="color: purple; font-size: 30px; font-weight: normal;">New Contact!</h3>
    <p>Name: ${ourObject.name}<br>
    Pet Interested In: ${doesPetExist.name}<br>
    Email: ${ourObject.email}<br>
    Message: ${ourObject.comment}
    </p>
    `
  })

  res.send("Thanks for sending data to us")
}
