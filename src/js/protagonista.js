import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Protagonista {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        this.velocity = new THREE.Vector3();
        this.speedBase = 0.55;
        this.speed = this.speedBase;
        this.mouseSensitivity = 0.002;
        this.mouseX = 0;
        this.mouseY = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.keys = {};
        this.mouseLocked = false;
        this.animFrame = 0;
        this.animSpeed = 0.15;
        this.partes = {};
        this.isCrouching = false;
        this.isRunning = false;
        this.velocidadY = 0;
        this.enSuelo = false;
        this.direccionDeseada = new THREE.Vector3();
        this.velocidadActual = new THREE.Vector3();
        this.inerciaSuavidad = 0.32;
        this.ultimoPaso = Date.now(); 

        // Configuración de audio
        this.audio = {
            listener: null,
            sounds: new Map(),
            currentMusic: null,
            musicVolume: 0.5,
            effectVolume: 0.7,
            initialized: false,
            audioContext: null // Agregar contexto de audio
        };
        
        this.cargarModelo();
        this.setupMouseControls();
        this.initAudio();
        
        // Intentar cargar música después de la interacción del usuario
        this.setupAudioInitialization();
    }

    // Configurar inicialización de audio después de interacción del usuario
    setupAudioInitialization() {
        const startAudio = async () => {
            console.log('Iniciando sistema de audio...');
            
            // Cargar la música de fondo
            try {
                const success = await this.cargarMusica('audio/counter.mp3', 'musica_fondo', true);
                if (success) {
                    console.log('Música cargada exitosamente');
                } else {
                    console.error('Error al cargar la música');
                }
            } catch (error) {
                console.error('Error al inicializar música:', error);
            }
            
            // Remover los event listeners después del primer uso
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };

        // Esperar a la primera interacción del usuario
        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });
    }

    initAudio() {
        try {
            // Crear el listener de audio y asociarlo a la cámara
            this.audio.listener = new THREE.AudioListener();
            this.camera.add(this.audio.listener);
            this.audio.initialized = true;
            console.log('Sistema de audio inicializado');
        } catch (error) {
            console.error('Error al inicializar el audio:', error);
        }
    }

    // Cargar y reproducir música de fondo
    async cargarMusica(url, nombre = 'musica_fondo', loop = true) {
        if (!this.audio.initialized) {
            console.warn('Sistema de audio no inicializado');
            return false;
        }

        try {
            // Detener música actual si existe
            if (this.audio.currentMusic && this.audio.currentMusic.isPlaying) {
                this.audio.currentMusic.stop();
            }

            console.log(`Intentando cargar música desde: ${url}`);

            // Crear el audio loader
            const audioLoader = new THREE.AudioLoader();
            
            // Cargar el archivo de audio con manejo de errores mejorado
            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load(
                    url,
                    // onLoad
                    (audioBuffer) => {
                        console.log('Buffer de audio cargado correctamente');
                        resolve(audioBuffer);
                    },
                    // onProgress
                    (progress) => {
                        console.log('Progreso de carga:', (progress.loaded / progress.total * 100) + '%');
                    },
                    // onError
                    (error) => {
                        console.error('Error al cargar el archivo de audio:', error);
                        reject(error);
                    }
                );
            });

            // Crear el audio object
            const audio = new THREE.Audio(this.audio.listener);
            audio.setBuffer(buffer);
            audio.setLoop(loop);
            audio.setVolume(this.audio.musicVolume);

            // Reproducir con manejo de errores
            try {
                audio.play();
                console.log('Audio iniciado correctamente');
            } catch (playError) {
                console.error('Error al reproducir audio:', playError);
                // Intentar reanudar el contexto de audio si está suspendido
                if (this.audio.listener.context.state === 'suspended') {
                    await this.audio.listener.context.resume();
                    audio.play();
                }
            }

            // Guardar referencia
            this.audio.currentMusic = audio;
            this.audio.sounds.set(nombre, audio);

            console.log(`Música "${nombre}" cargada y reproduciéndose`);
            return true;

        } catch (error) {
            console.error('Error al cargar la música:', error);
            return false;
        }
    }

    // Cargar efectos de sonido (sonidos posicionales)
    async cargarSonido(url, nombre, posicion = null) {
        if (!this.audio.initialized) {
            console.warn('Sistema de audio no inicializado');
            return false;
        }

        try {
            const audioLoader = new THREE.AudioLoader();
            
            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load(url, resolve, undefined, reject);
            });

            let audio;
            
            if (posicion) {
                // Sonido posicional (3D)
                audio = new THREE.PositionalAudio(this.audio.listener);
                audio.position.copy(posicion);
                audio.setRefDistance(5); // Distancia de referencia
            } else {
                // Sonido global
                audio = new THREE.Audio(this.audio.listener);
            }

            audio.setBuffer(buffer);
            audio.setVolume(this.audio.effectVolume);

            this.audio.sounds.set(nombre, audio);
            console.log(`Sonido "${nombre}" cargado`);
            return true;

        } catch (error) {
            console.error('Error al cargar el sonido:', error);
            return false;
        }
    }

    // Reproducir un sonido específico
    reproducirSonido(nombre) {
        const sonido = this.audio.sounds.get(nombre);
        if (sonido) {
            if (sonido.isPlaying) {
                sonido.stop();
            }
            sonido.play();
            return true;
        } else {
            // No mostrar warning para sonidos que no están cargados (como pasos)
            return false;
        }
    }

    // Pausar/reanudar música
    pausarMusica() {
        if (this.audio.currentMusic && this.audio.currentMusic.isPlaying) {
            this.audio.currentMusic.pause();
        }
    }

    reanudarMusica() {
        if (this.audio.currentMusic && !this.audio.currentMusic.isPlaying) {
            this.audio.currentMusic.play();
        }
    }

    // Detener música
    detenerMusica() {
        if (this.audio.currentMusic) {
            this.audio.currentMusic.stop();
        }
    }

    // Controlar volumen
    ajustarVolumenMusica(volumen) {
        this.audio.musicVolume = Math.max(0, Math.min(1, volumen));
        if (this.audio.currentMusic) {
            this.audio.currentMusic.setVolume(this.audio.musicVolume);
        }
    }

    ajustarVolumenEfectos(volumen) {
        this.audio.effectVolume = Math.max(0, Math.min(1, volumen));
        // Aplicar a todos los efectos cargados
        this.audio.sounds.forEach((sonido, nombre) => {
            if (nombre !== 'musica_fondo') {
                sonido.setVolume(this.audio.effectVolume);
            }
        });
    }

    cargarModelo() {
        // Solo modelo básico, para animar brazos y piernas
        const personajeGroup = new THREE.Group();
        // Cuerpo
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4169E1,
            transparent: true,
            opacity: 0
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        body.receiveShadow = true;
        personajeGroup.add(body);
        this.partes.body = body;
        // Cabeza
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.8;
        head.castShadow = true;
        head.receiveShadow = true;
        personajeGroup.add(head);
        this.partes.head = head;
        // Brazos
        const armGeometry = new THREE.CapsuleGeometry(0.2, 1, 4, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 });
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.8, 1.5, 0);
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        personajeGroup.add(leftArm);
        this.partes.leftArm = leftArm;
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.8, 1.5, 0);
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        personajeGroup.add(rightArm);
        this.partes.rightArm = rightArm;
        // Piernas
        const legGeometry = new THREE.CapsuleGeometry(0.25, 1.2, 4, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, 0.3, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        personajeGroup.add(leftLeg);
        this.partes.leftLeg = leftLeg;
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, 0.3, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        personajeGroup.add(rightLeg);
        this.partes.rightLeg = rightLeg;
        this.mesh = personajeGroup;
        this.mesh.position.set(0, 2, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Hacer visible para debug (temporalmente)
        this.mesh.visible = true;
        
        console.log('Protagonista creado en posición:', this.mesh.position);
    }

    setupMouseControls() {
        document.addEventListener('mousemove', (event) => {
            if (this.mouseLocked) {
                this.mouseX = event.movementX || 0;
                this.mouseY = event.movementY || 0;
            }
        });
        document.addEventListener('click', () => {
            if (!this.mouseLocked) {
                document.body.requestPointerLock();
            }
        });
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement !== null;
        });
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isRunning = true;
                this.speed = this.speedBase * 2.2;
            }
            if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
                this.isCrouching = true;
                this.speed = this.speedBase * 0.5;
            }
            // Salto
            if (event.code === 'Space') {
                if (this.enSuelo || (typeof distanciaSuelo !== 'undefined' && distanciaSuelo <= 0.15)) {
                    this.velocidadY = 0.26;
                    this.enSuelo = false;
                }
            }
        });
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isRunning = false;
                this.speed = this.speedBase;
            }
            if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
                this.isCrouching = false;
                this.speed = this.speedBase;
            }
        });
    }

    actualizar() {
        if (!this.mesh) return;
        this.actualizarMovimiento();
        this.actualizarRotacion();
        this.actualizarCamaraPrimeraPersona();
        this.animarCuerpo();
    }

    actualizarMovimiento() {
        this.direccionDeseada.set(0, 0, 0);
        let moviendo = false;
        if (this.keys['KeyW']) {
            this.direccionDeseada.z -= 1;
            moviendo = true;
        }
        if (this.keys['KeyS']) {
            this.direccionDeseada.z += 1;
            moviendo = true;
        }
        if (this.keys['KeyA']) {
            this.direccionDeseada.x -= 1;
            moviendo = true;
        }
        if (this.keys['KeyD']) {
            this.direccionDeseada.x += 1;
            moviendo = true;
        }
        if (this.direccionDeseada.length() > 0) {
            this.direccionDeseada.normalize();
            this.direccionDeseada.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
            this.direccionDeseada.multiplyScalar(this.speed);
        }
        this.velocidadActual.lerp(this.direccionDeseada, this.inerciaSuavidad);
        if (this.velocidadActual.length() > 0.001) {
            let puedeMover = true;
            
            // Verificación de límites del mapa primero
            const nuevaPos = this.mesh.position.clone().add(this.velocidadActual);
            const limiteSize = 60; // Mismo tamaño que los límites invisibles
            
            if (nuevaPos.x > limiteSize - 1 || nuevaPos.x < -limiteSize + 1 || 
                nuevaPos.z > limiteSize - 1 || nuevaPos.z < -limiteSize + 1) {
                puedeMover = false;
            }
            
            // Verificación de colisiones con obstáculos si está dentro de los límites
            if (puedeMover && window.juego && window.juego.obstaculos && window.juego.obstaculos.length > 0) {
                const raycasterLateral = new THREE.Raycaster();
                const origenLateral = this.mesh.position.clone();
                origenLateral.y += 1;
                const direccionLateral = this.velocidadActual.clone().normalize();
                raycasterLateral.set(origenLateral, direccionLateral);
                const interLateral = raycasterLateral.intersectObjects(window.juego.obstaculos, true);
                if (interLateral.length > 0 && interLateral[0].distance < 0.7) {
                    puedeMover = false;
                }
            }
            
            if (puedeMover) {
                this.mesh.position.x = nuevaPos.x;
                this.mesh.position.z = nuevaPos.z;
            }
        }
        let distanciaSuelo = Infinity;
        if (window.juego && window.juego.obstaculos && window.juego.obstaculos.length > 0) {
            const raycaster = new THREE.Raycaster();
            const origen = this.mesh.position.clone();
            origen.y += 2;
            raycaster.set(origen, new THREE.Vector3(0, -1, 0));
            const intersects = raycaster.intersectObjects(window.juego.obstaculos, true);
            if (intersects.length > 0) {
                const alturaSuelo = intersects[0].point.y + 1.0;
                distanciaSuelo = this.mesh.position.y - alturaSuelo;
                if (distanciaSuelo <= 0.15) {
                    this.mesh.position.y = alturaSuelo;
                    this.velocidadY = 0;
                    this.enSuelo = true;
                } else {
                    this.velocidadY -= 0.018;
                    this.mesh.position.y += this.velocidadY;
                    this.enSuelo = false;
                }
            } else {
                // Si no hay suelo detectado, mantener al jugador en el nivel base
                if (this.mesh.position.y < 0) {
                    this.mesh.position.y = 1.0; // Altura mínima del jugador
                    this.velocidadY = 0;
                    this.enSuelo = true;
                } else {
                    this.velocidadY -= 0.018;
                    this.mesh.position.y += this.velocidadY;
                    this.enSuelo = false;
                }
            }
        }
        this.estaCaminando = moviendo;

        // Sonidos de pasos (solo si el sonido está cargado)
        if (this.estaCaminando && this.enSuelo && this.audio.sounds.has('pasos')) {
            if (!this.ultimoPaso || Date.now() - this.ultimoPaso > (this.isRunning ? 300 : 500)) {
                this.reproducirSonido('pasos');
                this.ultimoPaso = Date.now();
            }
        }
    }

    actualizarRotacion() {
        if (this.mouseLocked) {
            this.rotationY -= this.mouseX * this.mouseSensitivity;
            this.rotationX -= this.mouseY * this.mouseSensitivity;
            this.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotationX));
        }
        this.mesh.rotation.y = this.rotationY;
        this.mouseX = 0;
        this.mouseY = 0;
    }

    actualizarCamaraPrimeraPersona() {
        // Cámara en la cabeza, seguimiento instantáneo tipo shooter
        if (this.partes.head) {
            const headWorldPos = new THREE.Vector3();
            this.partes.head.getWorldPosition(headWorldPos);
            this.camera.position.copy(headWorldPos);
            this.camera.position.y += 0.05;
            if (this.isCrouching) {
                this.camera.position.y -= 0.6;
            }
        } else {
            this.camera.position.copy(this.mesh.position);
            this.camera.position.y += 2.8;
            if (this.isCrouching) {
                this.camera.position.y -= 0.6;
            }
        }
        // Apuntar la cámara según la rotación del mouse, sin interpolación
        const lookDir = new THREE.Vector3(0, 0, -1);
        lookDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.rotationX);
        lookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
        const target = this.camera.position.clone().add(lookDir);
        this.camera.lookAt(target);
    }

    animarCuerpo() {
        // Animación simple de caminar: oscilar brazos y piernas
        let factor = 1;
        let amplitud = 0.6;
        if (this.isRunning) {
            factor = 2.2; // más rápido
            amplitud = 1.0; // más amplio
        } else if (this.isCrouching) {
            factor = 0.5; // más lento
            amplitud = 0.25; // menos amplio
        }
        if (!this.estaCaminando) {
            // Volver a posición neutral
            if (this.partes.leftArm) this.partes.leftArm.rotation.x *= 0.8;
            if (this.partes.rightArm) this.partes.rightArm.rotation.x *= 0.8;
            if (this.partes.leftLeg) this.partes.leftLeg.rotation.x *= 0.8;
            if (this.partes.rightLeg) this.partes.rightLeg.rotation.x *= 0.8;
            return;
        }
        this.animFrame += this.animSpeed * factor;
        const swing = Math.sin(this.animFrame) * amplitud;
        if (this.partes.leftArm) this.partes.leftArm.rotation.x = swing;
        if (this.partes.rightArm) this.partes.rightArm.rotation.x = -swing;
        if (this.partes.leftLeg) this.partes.leftLeg.rotation.x = -swing;
        if (this.partes.rightLeg) this.partes.rightLeg.rotation.x = swing;
    }

    resetear() {
        if (this.mesh) {
            this.mesh.position.set(0, 0, 0);
            this.rotationX = 0;
            this.rotationY = 0;
            this.velocity.set(0, 0, 0);
        }
    }

    obtenerPosicion() {
        return this.mesh ? this.mesh.position.clone() : new THREE.Vector3();
    }

    obtenerDireccion() {
        return new THREE.Vector3(
            Math.sin(this.rotationY),
            0,
            Math.cos(this.rotationY)
        );
    }

    limpiarAudio() {
        this.audio.sounds.forEach(sonido => {
            if (sonido.isPlaying) {
                sonido.stop();
            }
        });
        this.audio.sounds.clear();
        this.audio.currentMusic = null;
    }
}