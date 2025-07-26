export class Controles {
    constructor(protagonista, rifle, juego) {
        this.protagonista = protagonista;
        this.rifle = rifle;
        this.juego = juego;
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseLocked = false;
        this.lastTime = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Eventos de teclado
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            this.handleKeyDown(event);
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Eventos de mouse
        document.addEventListener('mousemove', (event) => {
            if (this.mouseLocked) {
                this.mouseX = event.movementX || 0;
                this.mouseY = event.movementY || 0;
            }
        });

        document.addEventListener('click', (event) => {
            this.handleMouseClick(event);
        });

        // Bloqueo de puntero
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement !== null;
        });

        // Eventos de contexto (clic derecho)
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // Eventos de redimensionamiento
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Eventos de visibilidad (pausar cuando la pestaña no está activa)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pausarJuego();
            } else {
                this.reanudarJuego();
            }
        });
    }

    handleKeyDown(event) {
        switch(event.code) {
            case 'KeyE':
                this.recogerRifle();
                break;
            case 'KeyR':
                this.recargarRifle();
                break;
            case 'KeyQ':
                this.soltarRifle();
                break;
            case 'Space':
                event.preventDefault();
                this.saltar();
                break;
            case 'ShiftLeft':
                this.correr();
                break;
            case 'KeyP':
                this.pausarJuego();
                break;
            case 'Escape':
                this.salirJuego();
                break;
        }
    }

    handleMouseClick(event) {
        if (!this.mouseLocked) {
            document.body.requestPointerLock();
            return;
        }

        // Disparar
        this.disparar();
    }

    handleResize() {
        // El redimensionamiento se maneja en la clase principal del juego
        if (this.juego && this.juego.onWindowResize) {
            this.juego.onWindowResize();
        }
    }

    recogerRifle() {
        if (this.rifle && !this.rifle.tieneRifle) {
            const distancia = this.protagonista.obtenerPosicion().distanceTo(this.rifle.obtenerPosicion());
            if (distancia < 3) {
                this.rifle.recoger(this.protagonista);
                this.mostrarMensaje('¡Rifle recogido!');
            } else {
                this.mostrarMensaje('Demasiado lejos del rifle');
            }
        }
    }

    recargarRifle() {
        if (this.rifle && this.rifle.tieneRifle) {
            this.rifle.recargar();
        }
    }

    soltarRifle() {
        if (this.rifle && this.rifle.tieneRifle) {
            this.rifle.soltar();
            this.mostrarMensaje('Rifle soltado');
        }
    }

    disparar() {
        if (this.rifle && this.rifle.tieneRifle) {
            if (this.juego && this.juego.disparar) {
                this.juego.disparar();
            }
        } else {
            this.mostrarMensaje('No tienes un rifle equipado');
        }
    }

    saltar() {
        // Implementación básica de salto
        if (this.protagonista && this.protagonista.mesh) {
            // Aquí se podría implementar un sistema de física más complejo
            this.mostrarMensaje('¡Saltando!');
        }
    }

    correr() {
        // Modificar velocidad del protagonista
        if (this.protagonista) {
            this.protagonista.speed = 0.25; // Velocidad aumentada
            
            // Restaurar velocidad normal después de un tiempo
            setTimeout(() => {
                if (this.protagonista) {
                    this.protagonista.speed = 0.15;
                }
            }, 1000);
        }
    }

    pausarJuego() {
        // Implementar pausa del juego
        this.mostrarMensaje('Juego pausado - Presiona P para continuar');
        // Aquí se podría implementar un sistema de pausa más complejo
    }

    reanudarJuego() {
        // Reanudar el juego
        this.mostrarMensaje('Juego reanudado');
    }

    salirJuego() {
        // Salir del juego
        if (confirm('¿Estás seguro de que quieres salir del juego?')) {
            window.close();
        }
    }

    mostrarMensaje(mensaje) {
        // Crear elemento de mensaje temporal
        const mensajeElement = document.createElement('div');
        mensajeElement.textContent = mensaje;
        mensajeElement.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
            font-family: Arial, sans-serif;
        `;
        
        document.body.appendChild(mensajeElement);
        
        // Remover el mensaje después de 2 segundos
        setTimeout(() => {
            if (mensajeElement.parentNode) {
                mensajeElement.parentNode.removeChild(mensajeElement);
            }
        }, 2000);
    }

    actualizar() {
        // Actualizar controles en cada frame
        this.actualizarMovimiento();
        this.actualizarMouse();
    }

    actualizarMovimiento() {
        if (!this.protagonista) return;

        // El movimiento se maneja en la clase Protagonista
        // Aquí solo verificamos si las teclas están presionadas
        const movimiento = {
            adelante: this.keys['KeyW'] || false,
            atras: this.keys['KeyS'] || false,
            izquierda: this.keys['KeyA'] || false,
            derecha: this.keys['KeyD'] || false,
            correr: this.keys['ShiftLeft'] || false
        };

        // Aplicar velocidad de correr si está presionado Shift
        if (movimiento.correr && this.protagonista.speed === 0.15) {
            this.protagonista.speed = 0.25;
        } else if (!movimiento.correr && this.protagonista.speed === 0.25) {
            this.protagonista.speed = 0.15;
        }
    }

    actualizarMouse() {
        // El mouse se maneja en la clase Protagonista
        // Aquí solo verificamos el estado del bloqueo
        if (!this.mouseLocked && document.pointerLockElement === null) {
            // Mostrar instrucción para hacer clic
            this.mostrarInstruccionMouse();
        }
    }

    mostrarInstruccionMouse() {
        // Mostrar instrucción para hacer clic y bloquear el mouse
        const instruccionElement = document.getElementById('mouseInstruction');
        if (!instruccionElement) {
            const element = document.createElement('div');
            element.id = 'mouseInstruction';
            element.textContent = 'Haz clic para comenzar a jugar';
            element.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 18px;
                z-index: 1000;
                pointer-events: none;
                font-family: Arial, sans-serif;
            `;
            document.body.appendChild(element);
        }
    }

    ocultarInstruccionMouse() {
        const instruccionElement = document.getElementById('mouseInstruction');
        if (instruccionElement) {
            instruccionElement.remove();
        }
    }

    obtenerEstadoTeclas() {
        return { ...this.keys };
    }

    obtenerEstadoMouse() {
        return {
            x: this.mouseX,
            y: this.mouseY,
            locked: this.mouseLocked
        };
    }
} 