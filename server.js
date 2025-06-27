const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
});
const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: 'Open' },
  priority: String,
  createdBy: String,
  assignedTo: String,
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (role === 'admin') {
    return res.status(403).json({ error: 'Admin registration is not allowed from the public endpoint.' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role });
  res.json(user);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid login' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

app.post('/tickets', authenticate, async (req, res) => {
  const ticket = await Ticket.create({ ...req.body, createdBy: req.user.id });
  res.json(ticket);
});

app.get('/tickets', authenticate, async (req, res) => {
  const role = req.user.role;
  const tickets = role === 'employee' ? await Ticket.find({ createdBy: req.user.id }) : await Ticket.find();
  res.json(tickets);
});

app.put('/tickets/:id', authenticate, async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(ticket);
});

app.get('/api/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const users = await User.find({}, '-password');
  res.json(users);
});

module.exports = app;