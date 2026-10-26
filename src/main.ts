import './ui/styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
if (!canvas) {
  throw new Error('No se encontró el canvas #game-canvas.');
}

const context = canvas.getContext('2d');
if (!context) {
  throw new Error('Este navegador no soporta Canvas 2D.');
}

context.fillStyle = '#0b0f0e';
context.fillRect(0, 0, canvas.width, canvas.height);
context.fillStyle = '#c8b98a';
context.font = '600 42px Georgia, serif';
context.textAlign = 'center';
context.fillText('BATTLE TANK — PERISCOPIO', canvas.width / 2, canvas.height / 2 - 10);
context.fillStyle = '#7d8a7a';
context.font = '18px Georgia, serif';
context.fillText('Bootstrap · construyendo el frente…', canvas.width / 2, canvas.height / 2 + 30);
