const express = require('express');
const router = express.Router();
const Evento = require('../models/Evento');

// GET - Consultar todos los eventos
router.get('/', async (req, res) => {
  try {
    const eventos = await Evento.find()
      .sort({ fecha_evento: 1, hora_inicio: 1 });
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Consultar con filtros combinables
router.get('/buscar', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.fecha_evento)  filtro.fecha_evento  = req.query.fecha_evento;
    if (req.query.estado)        filtro.estado        = req.query.estado;
    if (req.query.responsable)   filtro.responsable   = req.query.responsable;

    const eventos = await Evento.find(filtro)
      .sort({ fecha_evento: 1, hora_inicio: 1 });
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener un evento por ID (para editar)
router.get('/:id', async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    res.json(evento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Crear nuevo evento
router.post('/', async (req, res) => {
  try {
    const evento = new Evento(req.body);
    const nuevo = await evento.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT - Editar evento por ID
router.put('/:id', async (req, res) => {
  try {
    const datos = { ...req.body };
    // Campos que pueden volver a null si vienen vacíos
    ['costo_total', 'fecha_registro', 'notas']
      .forEach(campo => {
        if (datos[campo] === '' || datos[campo] === undefined) {
          datos[campo] = null;
        }
      });

    const actualizado = await Evento.findByIdAndUpdate(
      req.params.id,
      datos,
      { new: true }
    );
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Eliminar evento por ID
router.delete('/:id', async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Evento eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;