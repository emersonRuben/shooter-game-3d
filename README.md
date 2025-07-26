# 🎮 Juego de Disparos 3D

Un juego de disparos en primera persona desarrollado con **Three.js** y **Vite**.

## 🚀 Demo en Vivo

🔗 [Jugar Ahora](https://tu-usuario.github.io/juego/)

## ✨ Características

- 🎯 Juego de disparos en primera persona
- 🌍 Entornos 3D inmersivos
- 🎮 Controles fluidos con mouse y teclado
- 🔊 Efectos de sonido y música de fondo
- 📱 Interfaz responsive
- 🎨 Efectos visuales con post-procesamiento

## 🎮 Controles

- **WASD** - Movimiento
- **Mouse** - Mirar alrededor
- **Click Izquierdo** - Disparar
- **Shift** - Correr
- **Ctrl** - Agacharse
- **Esc** - Pausar/Menú

## 🛠️ Tecnologías Utilizadas

- **Three.js** - Motor gráfico 3D
- **Vite** - Build tool y dev server
- **JavaScript ES6+** - Lenguaje de programación
- **WebGL** - Renderizado 3D en el navegador

## 🏗️ Instalación y Desarrollo

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/juego.git

# Entrar al directorio
cd juego

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 📁 Estructura del Proyecto

```
juego/
├── public/
│   ├── models/          # Modelos 3D (.glb)
│   ├── audio/           # Archivos de audio
│   └── images/          # Imágenes y texturas
├── src/
│   └── js/              # Código JavaScript
│       ├── main.js      # Archivo principal del juego
│       ├── protagonista.js
│       ├── enemigo.js
│       ├── rifle.js
│       └── controles.js
├── index.html           # Menú principal
├── juego.html           # Pantalla del juego
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Despliegue en GitHub Pages

### Para desarrollo local:
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build local
```

### Para GitHub Pages:
1. **Crea un repositorio en GitHub**
2. **En `vite.config.js`**, cambia:
   ```js
   base: '/nombre-repositorio/',  // Nombre exacto de tu repositorio
   ```
3. **Sube el código:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/nombre-repo.git
   git push -u origin main
   ```
4. **Deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🎯 Próximas Características

- [ ] Más tipos de enemigos
- [ ] Sistema de niveles
- [ ] Powerups y mejoras
- [ ] Multijugador
- [ ] Modo historia

## 🐛 Reportar Bugs

Si encuentras algún bug, por favor créalo en [Issues](https://github.com/tu-usuario/juego/issues).

---

⭐ ¡No olvides darle una estrella si te gustó el proyecto!
