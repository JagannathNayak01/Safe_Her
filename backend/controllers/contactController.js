const Contact = require('../models/Contact');

exports.addContact = async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    // Check for duplicate name (case‑insensitive, trimmed) for this user
    const trimmedName = name.trim();
    const existingContact = await Contact.findOne({
      user: req.user.id,
      name: { $regex: `^${trimmedName}$`, $options: 'i' }
    });

    if (existingContact) {
      return res.status(400).json({ msg: 'Contact with this name already exists' });
    }

    const contact = new Contact({
      user: req.user.id,
      name,
      phone,
      email,
    });
    await contact.save();
    res.json(contact);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ msg: 'Contact not found' });
    if (contact.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Contact removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateContact = async (req, res) => {
  const { name, phone, email } = req.body;
  const contactFields = {};
  if (name) contactFields.name = name;
  if (phone) contactFields.phone = phone;
  if (email) contactFields.email = email;
  try {
    let contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ msg: 'Contact not found' });
    if (contact.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields },
      { new: true }
    );
    res.json(contact);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
