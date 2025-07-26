import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Enemigo {
    constructor(scene, protagonista) {
        this.scene = scene;
        this.protagonista = protagonista;
        this.mesh = null;
        this.vida = 100;
        this.vivo = true;
        this.speed = 0.03;
        this.detectionRange = 15;
        this.attackRange = 2;
        this.velocity = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 segundo entre ataques
        this.healthBar = null;
        this.posicion = new THREE.Vector3(0, 0, 0);
        
        this.generarPosicionInicial();
        this.cargarModelo();
    }

    cargarModelo() {
        const loader = new GLTFLoader();
        
        loader.load(
            'models/enemigo1.glb', // Ruta relativa
            (gltf) => {
                console.log('Modelo de enemigo GLB cargado');
                this.mesh = gltf.scene;
                this.mesh.scale.set(1, 1, 1);
                this.mesh.position.copy(this.posicion);
                
                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.scene.add(this.mesh);
                this.crearHealthBar();
                console.log('Modelo enemigo cargado exitosamente');
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% cargado');
            },
            (error) => {
                console.warn('Error al cargar enemigo GLB, usando modelo básico:', error);
                this.crearEnemigoBasico();
            }
        );
    }

    crearEnemigoBasico() {
        console.log('Creando enemigo básico como respaldo');
        
        const enemigoGroup = new THREE.Group();
        
        // Cuerpo del enemigo (rojo para distinguirlo)
        const bodyGeometry = new THREE.CapsuleGeometry(0.6, 1.8, 4, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        body.receiveShadow = true;
        enemigoGroup.add(body);
        
        // Cabeza
        const headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.9;
        head.castShadow = true;
        head.receiveShadow = true;
        enemigoGroup.add(head);
        
        // Ojos rojos brillantes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const eyeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.3
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 3, 0.4);
        leftEye.castShadow = true;
        leftEye.receiveShadow = true;
        enemigoGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 3, 0.4);
        rightEye.castShadow = true;
        rightEye.receiveShadow = true;
        enemigoGroup.add(rightEye);
        
        // Brazos
        const armGeometry = new THREE.CapsuleGeometry(0.25, 1.2, 4, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1, 1.5, 0);
        leftArm.rotation.z = Math.PI / 4;
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        enemigoGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1, 1.5, 0);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        enemigoGroup.add(rightArm);
        
        // Piernas
        const legGeometry = new THREE.CapsuleGeometry(0.3, 1.4, 4, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.4, 0.2, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        enemigoGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.4, 0.2, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        enemigoGroup.add(rightLeg);
        
        this.mesh = enemigoGroup;
        this.mesh.position.copy(this.posicion);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        this.crearHealthBar();
        console.log('Modelo básico de enemigo creado en posición:', this.mesh.position);
    }

    crearHealthBar() {
        // Crear barra de vida flotante sobre el enemigo
        const healthBarGeometry = new THREE.PlaneGeometry(2, 0.2);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.y = 4;
        this.healthBar.visible = false;
        
        if (this.mesh) {
            this.mesh.add(this.healthBar);
        }
    }

    generarPosicionInicial() {
        // Generar posición aleatoria cerca del origen
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 10;
        
        this.posicion.set(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        
        // Si el mesh ya existe, actualizar su posición
        if (this.mesh) {
            this.mesh.position.copy(this.posicion);
        }
    }

    actualizar() {
        if (!this.mesh || !this.vivo) return;

        this.actualizarIA();
        this.actualizarMovimiento();
        this.actualizarHealthBar();
    }

    actualizarIA() {
        const distanciaAlProtagonista = this.mesh.position.distanceTo(this.protagonista.obtenerPosicion());
        
        if (distanciaAlProtagonista <= this.detectionRange) {
            // Perseguir al protagonista
            this.targetPosition.copy(this.protagonista.obtenerPosicion());
            
            // Atacar si está cerca
            if (distanciaAlProtagonista <= this.attackRange) {
                this.atacar();
            }
        } else {
            // Patrullar aleatoriamente
            if (this.mesh.position.distanceTo(this.targetPosition) < 2) {
                this.generarNuevaPosicionPatrulla();
            }
        }
    }

    actualizarMovimiento() {
        if (this.targetPosition) {
            // Calcular dirección hacia el objetivo
            const direccion = this.targetPosition.clone().sub(this.mesh.position);
            
            if (direccion.length() > 0) {
                direccion.normalize();
                direccion.multiplyScalar(this.speed);
                
                // Aplicar movimiento
                this.mesh.position.add(direccion);
                
                // Hacer que el enemigo mire hacia donde va
                this.mesh.lookAt(this.targetPosition);
            }
        }
        
        // Mantener en el suelo
        this.mesh.position.y = 0;
    }

    generarNuevaPosicionPatrulla() {
        const posicionActual = this.mesh.position.clone();
        const angulo = Math.random() * Math.PI * 2;
        const distancia = 5 + Math.random() * 10;
        
        this.targetPosition.set(
            posicionActual.x + Math.cos(angulo) * distancia,
            0,
            posicionActual.z + Math.sin(angulo) * distancia
        );
    }

    atacar() {
        const tiempoActual = Date.now();
        if (tiempoActual - this.lastAttackTime > this.attackCooldown) {
            // Aquí se podría emitir un evento o llamar a una función del juego
            // para que el protagonista reciba daño
            this.lastAttackTime = tiempoActual;
            
            // Efecto visual de ataque
            this.mesh.scale.setScalar(0.35);
            setTimeout(() => {
                if (this.mesh) {
                    this.mesh.scale.setScalar(0.3);
                }
            }, 100);
        }
    }

    recibirDano(cantidad) {
        this.vida -= cantidad;
        
        // Efecto visual de daño
        if (this.mesh) {
            this.mesh.material = this.mesh.material || new THREE.MeshLambertMaterial();
            this.mesh.material.color.setHex(0xFF0000);
            setTimeout(() => {
                if (this.mesh && this.mesh.material) {
                    this.mesh.material.color.setHex(0xDC143C);
                }
            }, 200);
        }
        
        if (this.vida <= 0) {
            this.morir();
        }
    }

    morir() {
        this.vivo = false;
        
        // Animación de muerte
        if (this.mesh) {
            // Hacer que el enemigo se desvanezca
            const fadeOut = setInterval(() => {
                if (this.mesh && this.mesh.material) {
                    if (this.mesh.material.opacity !== undefined) {
                        this.mesh.material.opacity -= 0.1;
                        this.mesh.material.transparent = true;
                        
                        if (this.mesh.material.opacity <= 0) {
                            clearInterval(fadeOut);
                            this.scene.remove(this.mesh);
                        }
                    }
                }
            }, 50);
        }
    }

    actualizarHealthBar() {
        if (this.healthBar && this.vida < 100) {
            this.healthBar.visible = true;
            
            // Actualizar color basado en la vida
            const porcentajeVida = this.vida / 100;
            if (porcentajeVida > 0.6) {
                this.healthBar.material.color.setHex(0x00FF00); // Verde
            } else if (porcentajeVida > 0.3) {
                this.healthBar.material.color.setHex(0xFFFF00); // Amarillo
            } else {
                this.healthBar.material.color.setHex(0xFF0000); // Rojo
            }
            
            // Actualizar tamaño de la barra
            this.healthBar.scale.x = porcentajeVida;
        }
    }

    obtenerPosicion() {
        return this.mesh ? this.mesh.position.clone() : new THREE.Vector3();
    }
} 