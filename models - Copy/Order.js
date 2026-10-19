const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    integer: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    maxlength: 64
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    maxlength: 128
  },
  customerId: {
    type: Number,
    default: null
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 160
  },
  address: {
    type: String,
    trim: true,
    maxlength: 300
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (items) => items.length > 0,
      message: 'An order must contain at least one item.'
    }
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (document, returnedObject) => {
      returnedObject.orderId = returnedObject.orderId;
      delete returnedObject.__v;
      delete returnedObject.idempotencyKey;
      return returnedObject;
    }
  }
});

module.exports = mongoose.model('Order', orderSchema);
