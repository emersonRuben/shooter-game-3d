import * as THREE from 'three';
import { Protagonista } from './protagonista.js';
import { Rifle } from './rifle.js';
import { Enemigo } from './enemigo.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'stats.js';

class Juego {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.protagonista = null;
        this.rifle = null;
        this.balas = [];
        this.obstaculos = []; 
        this.enemigos = [];
        // Variables de jugabilidad
        this.puntaje = 0;
        this.vida = 100;
        this.maxVida = 100;
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: FPS
        document.body.appendChild(this.stats.dom);
        this.init();
    }

    init() {
        this.setupScene();
        this.setupLights();
        this.setupMapa();
        this.setupDecor();
        this.setupProtagonista();
        this.setupRifle();
        this.setupEnemigos(); // Agregar esta línea
        this.setupPostprocessing();
        this.setupEventListeners();
        this.actualizarUI();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6fa8dc);
        this.scene.fog = new THREE.Fog(0x6fa8dc, 50, 200);
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        const canvas = document.querySelector('#c');
        
        // Configurar WebGL para usar GPU de alto rendimiento
        const contextAttributes = {
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance', // Forzar GPU dedicada
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
            premultipliedAlpha: true,
            stencil: true,
            depth: true
        };
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            ...contextAttributes
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar para mejor rendimiento
        this.renderer.shadowMap.enabled = false;
        
        // Verificar qué GPU se está usando
        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            console.log('GPU Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
            console.log('GPU Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
        }
    }

    setupLights() {
        // Luz ambiental más suave
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Luz hemisférica (simula cielo y suelo)
        const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x7cfc00, 0.5); // cielo azul claro, suelo verde claro
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        // Luz direccional (sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
        directionalLight.position.set(30, 40, 20);
        directionalLight.castShadow = false;
        this.scene.add(directionalLight);

        // Luz puntual suave para ambiente
        const pointLight = new THREE.PointLight(0xfff2cc, 0.2, 50);
        pointLight.position.set(0, 10, 0);
        pointLight.castShadow = false;
        this.scene.add(pointLight);
    }

    setupMapa() {
        const loader = new GLTFLoader();
        loader.load(
            'models/mapa1.glb',
            (gltf) => {
                const mapa = gltf.scene;
                mapa.position.y = -3;
                mapa.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (!child.name.toLowerCase().includes('decor') && child.material) {
                            this.obstaculos.push(child);
                        }
                    }
                });
                this.scene.add(mapa);
                console.log('Mapa cargado exitosamente');
                
                // Agregar límites invisibles para contener al jugador
                this.crearLimitesInvisibles();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% cargado');
            },
            (error) => {
                console.error('Error cargando models/mapa1.glb:', error);
                // Crear límites aunque no se cargue el mapa
                this.crearLimitesInvisibles();
            }
        );
    }

    crearLimitesInvisibles() {
        const limiteSize = 40; // Tamaño del área jugable
        const alturaLimite = 20;
        
        // Material invisible para los límites
        const limiteMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0,
            visible: false
        });
        
        // Límite Norte
        const limiteNorte = new THREE.Mesh(
            new THREE.BoxGeometry(limiteSize * 2, alturaLimite, 1),
            limiteMaterial
        );
        limiteNorte.position.set(0, alturaLimite/2, -limiteSize);
        this.scene.add(limiteNorte);
        this.obstaculos.push(limiteNorte);
        
        // Límite Sur
        const limiteSur = new THREE.Mesh(
            new THREE.BoxGeometry(limiteSize * 2, alturaLimite, 1),
            limiteMaterial
        );
        limiteSur.position.set(0, alturaLimite/2, limiteSize);
        this.scene.add(limiteSur);
        this.obstaculos.push(limiteSur);
        
        // Límite Este
        const limiteEste = new THREE.Mesh(
            new THREE.BoxGeometry(1, alturaLimite, limiteSize * 2),
            limiteMaterial
        );
        limiteEste.position.set(limiteSize, alturaLimite/2, 0);
        this.scene.add(limiteEste);
        this.obstaculos.push(limiteEste);
        
        // Límite Oeste
        const limiteOeste = new THREE.Mesh(
            new THREE.BoxGeometry(1, alturaLimite, limiteSize * 2),
            limiteMaterial
        );
        limiteOeste.position.set(-limiteSize, alturaLimite/2, 0);
        this.scene.add(limiteOeste);
        this.obstaculos.push(limiteOeste);
        
        console.log('Límites invisibles creados para contener al jugador');
    }

    setupDecor() {
        const decorGroup = new THREE.Group();
        // Árboles
        for (let i = 0; i < 4; i++) {
            const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set((Math.random() - 0.5) * 30, 1, (Math.random() - 0.5) * 30);
            trunk.castShadow = false;
            trunk.receiveShadow = false;
            decorGroup.add(trunk);
            const leavesGeometry = new THREE.SphereGeometry(1, 8, 8);
            const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(trunk.position.x, 2.2, trunk.position.z);
            leaves.castShadow = false;
            leaves.receiveShadow = false;
            decorGroup.add(leaves);
        }
        // Cajas
        for (let i = 0; i < 3; i++) {
            const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.set((Math.random() - 0.5) * 30, 0.5, (Math.random() - 0.5) * 30);
            box.castShadow = false;
            box.receiveShadow = false;
            decorGroup.add(box);
        }
        // Rocas
        for (let i = 0; i < 2; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(0.7, 0);
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set((Math.random() - 0.5) * 30, 0.4, (Math.random() - 0.5) * 30);
            rock.castShadow = false;
            rock.receiveShadow = false;
            decorGroup.add(rock);
        }
        this.scene.add(decorGroup);
    }

    setupProtagonista() {
        this.protagonista = new Protagonista(this.scene, this.camera);
    }

    setupRifle() {
        this.rifle = new Rifle(this.scene, this.protagonista.mesh.position.clone());
    }

    setupEnemigos() {
        console.log('Creando enemigos en el mapa...');
        
        // Posiciones específicas para los enemigos en el mapa
        const posicionesEnemigos = [
            { x: 10, y: 0, z: 10 },
            { x: -15, y: 0, z: 5 },
            { x: 5, y: 0, z: -12 },
            { x: 20, y: 0, z: -5 },    
            { x: -10, y: 0, z: 15 }    
        ];

        posicionesEnemigos.forEach((pos, index) => {
            const enemigo = new Enemigo(this.scene, this.protagonista);
            
            // Establecer posición específica para cada enemigo
            if (enemigo.mesh) {
                enemigo.mesh.position.set(pos.x, pos.y, pos.z);
            } else {
                // Si el mesh no está listo, establecer la posición inicial
                enemigo.posicion.set(pos.x, pos.y, pos.z);
            }
            
            this.enemigos.push(enemigo);
            console.log(`Enemigo ${index + 1} colocado en posición:`, pos);
        });
        
        console.log(`Total de enemigos creados: ${this.enemigos.length}`);
    }

    setupPostprocessing() {
        // Configurar composer solo si la GPU puede manejarlo
        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        let usePostprocessing = true;
        
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Desactivar postprocesamiento en GPUs integradas para mejor rendimiento
            if (renderer.toLowerCase().includes('intel')) {
                usePostprocessing = false;
                console.log('GPU integrada detectada, desactivando postprocesamiento para mejor rendimiento');
            }
        }
        
        if (usePostprocessing) {
            // Configurar postprocesamiento optimizado para GPU dedicada
            this.composer = new EffectComposer(this.renderer);
            
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Bloom pass con configuración optimizada
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.5,  // strength reducida
                0.8,  // radius
                0.1   // threshold
            );
            this.composer.addPass(bloomPass);
            
            console.log('Postprocesamiento activado para GPU dedicada');
        } else {
            this.composer = null;
            console.log('Renderizado directo para máximo rendimiento');
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('click', () => this.disparar());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown(event) {
        switch(event.code) {
            case 'KeyE':
                this.recogerRifle();
                break;
            case 'KeyR':
                this.rifle.recargar();
                break;
        }
    }

    disparar() {
        if (this.rifle && this.rifle.tieneRifle && this.rifle.balas > 0) {
            const bala = this.rifle.disparar(this.camera);
            if (bala) {
                this.balas.push(bala);
                this.scene.add(bala.mesh);
            }
        }
    }

    recogerRifle() {
        if (this.protagonista && this.rifle && this.protagonista.mesh && this.rifle.mesh) {
            const distancia = this.protagonista.mesh.position.distanceTo(this.rifle.mesh.position);
            if (distancia < 3 && !this.rifle.tieneRifle) {
                this.rifle.recoger(this.protagonista);
            }
        }
    }

    animate() {
        this.stats.begin();
        requestAnimationFrame(() => this.animate());
        
        this.protagonista.actualizar();
        if (this.rifle) this.rifle.actualizar();
        
        // Actualizar enemigos
        this.enemigos.forEach(enemigo => {
            if (enemigo.vivo) {
                enemigo.actualizar();
            }
        });
        
        this.actualizarBalas();
        this.verificarColisionesBalas(); // Agregar detección de colisiones
        
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        this.stats.end();
    }

    // Agregar detección de colisiones bala-enemigo
    verificarColisionesBalas() {
        for (let i = this.balas.length - 1; i >= 0; i--) {
            const bala = this.balas[i];
            
            for (let j = 0; j < this.enemigos.length; j++) {
                const enemigo = this.enemigos[j];
                
                if (enemigo.vivo && enemigo.mesh) {
                    // Crear una caja de colisión más grande para el enemigo
                    const enemigoPos = enemigo.mesh.position;
                    const balaPos = bala.mesh.position;
                    
                    // Verificar colisión en un área más amplia (caja 3D)
                    const deltaX = Math.abs(balaPos.x - enemigoPos.x);
                    const deltaY = Math.abs(balaPos.y - enemigoPos.y);
                    const deltaZ = Math.abs(balaPos.z - enemigoPos.z);
                    
                    // Dimensiones de la caja de colisión del enemigo
                    const anchoEnemigo = 1.5;  // Ancho del enemigo
                    const altoEnemigo = 3.0;   // Alto del enemigo
                    const profundidadEnemigo = 1.5; // Profundidad del enemigo
                    
                    if (deltaX < anchoEnemigo && 
                        deltaY < altoEnemigo && 
                        deltaZ < profundidadEnemigo) {
                        
                        // Bala impacta enemigo
                        enemigo.recibirDano(25);
                        
                        // Remover bala
                        this.scene.remove(bala.mesh);
                        this.balas.splice(i, 1);
                        
                        // Aumentar puntaje si el enemigo murió
                        if (!enemigo.vivo) {
                            this.aumentarPuntaje(100);
                        }
                        
                        break;
                    }
                }
            }
        }
    }

    actualizarBalas() {
        for (let i = this.balas.length - 1; i >= 0; i--) {
            const bala = this.balas[i];
            bala.actualizar();
            if (bala.distanciaRecorrida > 100) {
                if (bala.mesh.geometry) bala.mesh.geometry.dispose();
                if (bala.mesh.material) bala.mesh.material.dispose();
                this.scene.remove(bala.mesh);
                this.balas.splice(i, 1);
            }
        }
    }

    // Llama esto cada vez que cambie la vida o el puntaje
    actualizarUI() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Puntuación: ${this.puntaje}`;
        }
        const healthElement = document.getElementById('health');
        if (healthElement) {
            // Barra de vida visual
            const porcentaje = Math.max(0, this.vida) / this.maxVida;
            healthElement.innerHTML = `Vida: <span style="display:inline-block;width:100px;height:16px;background:#333;border-radius:8px;vertical-align:middle;overflow:hidden;"><span style="display:inline-block;height:16px;width:${porcentaje*100}px;background:${porcentaje>0.6?'#4caf50':porcentaje>0.3?'#ffd700':'#ff6b6b'};transition:width 0.3s;"></span></span> ${Math.max(0, Math.round(this.vida))}`;
        }
    }

    // Llama esto cuando el jugador elimine un enemigo
    aumentarPuntaje(valor = 100) {
        this.puntaje += valor;
        this.actualizarUI();
    }

    // Llama esto cuando el jugador reciba daño
    recibirDanio(cantidad = 10) {
        this.vida -= cantidad;
        if (this.vida < 0) this.vida = 0;
        this.actualizarUI();
        if (this.vida <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        // Mostrar pantalla de game over
        const gameOverDiv = document.getElementById('gameOver');
        const finalScore = document.getElementById('finalScore');
        if (gameOverDiv && finalScore) {
            finalScore.textContent = `Puntuación final: ${this.puntaje}`;
            gameOverDiv.style.display = 'block';
        }
        // Detener animación si quieres (opcional)
    }

    // Comprobar colisión del jugador con obstáculos
    colisionaConObstaculo(posicion) {
        const jugadorBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(posicion.x, 1, posicion.z),
            new THREE.Vector3(1, 2, 1) // Tamaño aproximado del jugador
        );
        for (const obstaculo of this.obstaculos) {
            obstaculo.updateMatrixWorld();
            const box = new THREE.Box3().setFromObject(obstaculo);
            if (jugadorBox.intersectsBox(box)) {
                return true;
            }
        }
        return false;
    }
}

window.addEventListener('load', () => {
    window.juego = new Juego();
});