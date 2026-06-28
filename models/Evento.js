const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
  fecha_evento: {
    type: String,
    required: true
  },
  hora_inicio: {
    type: String,
    required: true
  },
  hora_fin: {
    type: String,
    required: true
  },
  lugar: {
    type: String,
    required: true
  },
  tipo_evento: {
    type: String,
    required: true
  },
  responsable: {
    type: String,
    required: true
  },
  costo_total: {
    type: Number,
    default: null
  },
  estado: {
    type: String,
    enum: ['pendiente', 'realizado', 'cancelado'],
    default: 'pendiente'
  },
  notas: {
    type: String,
    default: null
  },
  fecha_registro: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('Evento', eventoSchema);