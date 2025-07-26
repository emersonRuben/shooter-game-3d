import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Rifle {
    constructor(scene, posicionJugador) {
        this.scene = scene;
        this.mesh = null;
        this.tieneRifle = false;
        this.balas = 30;
        this.balasMaximas = 30;
        this.recargando = false;
        this.tiempoRecarga = 2000; // 2 segundos
        this.protagonista = null;
        this.offsetRifle = new THREE.Vector3(0.5, -0.3, -0.8);
        this.rotationRifle = new THREE.Euler(0, 0, 0);
        this.recargaOffset = new THREE.Vector3(0, 0, 0);
        this.recargaRotOffset = new THREE.Euler(0, 0, 0);
        this.posicionJugador = posicionJugador ? posicionJugador.clone() : new THREE.Vector3(0, 6, 0);
        
        this.cargarModelo();
    }

    cargarModelo() {
        const loader = new GLTFLoader();
        
        loader.load(
            'models/rifle.glb', // Ruta relativa
            (gltf) => {
                this.mesh = gltf.scene;
                this.mesh.scale.setScalar(0.3);
                this.mesh.castShadow = true;
                this.mesh.receiveShadow = true;
                
                // Posicionar el rifle más alejado y un poco más bajo respecto al jugador
                this.mesh.position.set(
                    this.posicionJugador.x + 5,
                    this.posicionJugador.y - 5,
                    this.posicionJugador.z
                );
                this.scene.add(this.mesh);
                
                console.log('Modelo rifle cargado exitosamente');
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% cargado');
            },
            (error) => {
                console.error('Error cargando models/rifle.glb:', error);
                this.crearRifleBasico();
            }
        );
    }

    crearRifleBasico() {
        console.log('Creando rifle básico como respaldo');
        
        const rifleGroup = new THREE.Group();
        
        // Cañón del rifle
        const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        rifleGroup.add(barrel);
        
        // Culata del rifle
        const stockGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.8);
        const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(-0.6, 0, 0);
        stock.castShadow = true;
        stock.receiveShadow = true;
        rifleGroup.add(stock);
        
        // Gatillo
        const triggerGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.05);
        const triggerMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
        trigger.position.set(0.2, -0.1, 0);
        trigger.castShadow = true;
        trigger.receiveShadow = true;
        rifleGroup.add(trigger);
        
        // Mira
        const sightGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
        const sightMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const sight = new THREE.Mesh(sightGeometry, sightMaterial);
        sight.position.set(0.3, 0.1, 0);
        sight.castShadow = true;
        sight.receiveShadow = true;
        rifleGroup.add(sight);
        
        this.mesh = rifleGroup;
        this.mesh.position.set(2, 0, 2);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    recoger(protagonista) {
        this.protagonista = protagonista;
        this.tieneRifle = true;
        // Animación de subida: guardar posición inicial y objetivo
        if (this.mesh) {
            this.animandoRecogida = true;
            this.posInicial = this.mesh.position.clone();
            this.rotInicial = this.mesh.rotation.clone();
            this.tiempoAnim = 0;
        }
        console.log('Rifle recogido. Balas:', this.balas);
        this.mostrarMensaje('¡Rifle recogido! Presiona R para recargar');
    }

    soltar() {
        if (this.tieneRifle) {
            this.tieneRifle = false;
            this.protagonista = null;
            
            // Mostrar el rifle en el suelo cerca del protagonista
            if (this.mesh) {
                this.mesh.visible = true;
                this.mesh.position.copy(this.protagonista.obtenerPosicion());
                this.mesh.position.x += 2;
                this.mesh.position.z += 2;
            }
        }
    }

    disparar(camera) {
        if (!this.tieneRifle || this.recargando || this.balas <= 0) {
            if (this.balas <= 0) {
                this.mostrarMensaje('¡Sin balas! Presiona R para recargar');
            }
            return null;
        }

        this.balas--;
        
        // Crear bala
        const bala = this.crearBala(camera);
        
        // Efecto de retroceso
        this.efectoRetroceso();
        
        // Efecto de sonido visual (flash)
        this.efectoFlash();
        
        // Actualizar UI
        this.actualizarUI();
        
        return bala;
    }

    crearBala(camera) {
        // Crear geometría de la bala
        const balaGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const balaMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.3
        });
        const balaMesh = new THREE.Mesh(balaGeometry, balaMaterial);
        
        // Posición inicial de la bala (desde la cámara)
        balaMesh.position.copy(camera.position);
        
        // Dirección de la bala (hacia donde mira la cámara)
        const direccion = new THREE.Vector3(0, 0, -1);
        direccion.applyQuaternion(camera.quaternion);
        
        // Velocidad de la bala
        const velocidad = direccion.multiplyScalar(2);
        
        return {
            mesh: balaMesh,
            velocidad: velocidad,
            distanciaRecorrida: 0,
            actualizar: () => {
                balaMesh.position.add(velocidad);
                this.distanciaRecorrida += velocidad.length();
            }
        };
    }

    efectoRetroceso() {
        if (this.mesh && this.tieneRifle) {
            // Efecto de retroceso simple
            const posicionOriginal = this.mesh.position.clone();
            this.mesh.position.z += 0.1;
            
            setTimeout(() => {
                if (this.mesh) {
                    this.mesh.position.copy(posicionOriginal);
                }
            }, 50);
        }
    }

    efectoFlash() {
        // Crear flash de disparo
        const flashGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        if (this.protagonista && this.protagonista.mesh) {
            flash.position.copy(this.protagonista.mesh.position);
            flash.position.y += 1.5;
            flash.position.z -= 1;
            this.scene.add(flash);
            
            // Animar el flash
            const fadeOut = setInterval(() => {
                flash.material.opacity -= 0.1;
                if (flash.material.opacity <= 0) {
                    clearInterval(fadeOut);
                    this.scene.remove(flash);
                }
            }, 20);
        }
    }

    recargar() {
        if (this.recargando || this.balas === this.balasMaximas) {
            return;
        }
        this.recargando = true;
        this.mostrarMensaje('Recargando...');
        this.animarRecarga(() => {
            this.balas = this.balasMaximas;
            this.recargando = false;
            this.actualizarUI();
            this.mostrarMensaje('¡Recargado!');
        });
    }

    animarRecarga(onFinish) {
        if (!this.mesh) {
            if (onFinish) onFinish();
            return;
        }
        let t = 0;
        const dur = this.tiempoRecarga / 1000; // segundos
        const anim = () => {
            if (!this.recargando) {
                this.recargaOffset.set(0, 0, 0);
                this.recargaRotOffset.set(0, 0, 0);
                if (onFinish) onFinish();
                return;
            }
            t += 0.04;
            const progress = Math.min(t / dur, 1);
            const yOffset = -0.3 * Math.sin(Math.PI * progress);
            this.recargaOffset.set(0, yOffset, 0);
            this.recargaRotOffset.set(0.5 * Math.sin(Math.PI * progress), 0, 0);
            if (progress < 1 && this.recargando) {
                requestAnimationFrame(anim);
            } else {
                this.recargaOffset.set(0, 0, 0);
                this.recargaRotOffset.set(0, 0, 0);
                if (onFinish) onFinish();
            }
        };
        anim();
    }

    actualizar() {
        if (this.tieneRifle && this.protagonista && this.mesh) {
            // Animación de recogida suave
            if (this.animandoRecogida) {
                this.tiempoAnim += 0.08;
                // Posición objetivo: cerca de la cámara (primera persona)
                const cam = this.protagonista.camera;
                const offset = new THREE.Vector3(0.25, -0.35, -0.7);
                offset.add(this.recargaOffset);
                const posObjetivo = cam.position.clone().add(offset.applyQuaternion(cam.quaternion));
                this.mesh.position.lerp(posObjetivo, Math.min(this.tiempoAnim, 1));
                // Rotación objetivo
                const euler = new THREE.Euler();
                euler.setFromQuaternion(cam.quaternion);
                euler.z -= 0.12;
                euler.x -= 0.04;
                euler.x += this.recargaRotOffset.x;
                euler.y += this.recargaRotOffset.y;
                euler.z += this.recargaRotOffset.z;
                this.mesh.quaternion.slerp(new THREE.Quaternion().setFromEuler(euler), Math.min(this.tiempoAnim, 1));
                if (this.tiempoAnim >= 1) {
                    this.animandoRecogida = false;
                }
            } else {
                // Posicionar el rifle más cerca del centro de la pantalla, alineado con la mira
                const cam = this.protagonista.camera;
                const offset = new THREE.Vector3(0.25, -0.35, -0.7);
                offset.add(this.recargaOffset);
                const pos = cam.position.clone();
                offset.applyQuaternion(cam.quaternion);
                pos.add(offset);
                this.mesh.position.copy(pos);
                // Rotación: mantener inclinación tipo shooter + offset de recarga
                const euler = new THREE.Euler();
                euler.setFromQuaternion(cam.quaternion);
                euler.z -= 0.12;
                euler.x -= 0.04;
                euler.x += this.recargaRotOffset.x;
                euler.y += this.recargaRotOffset.y;
                euler.z += this.recargaRotOffset.z;
                this.mesh.quaternion.setFromEuler(euler);
            }
        } else if (this.mesh && !this.tieneRifle) {
            this.mesh.visible = true;
        }
    }

    actualizarUI() {
        // Actualizar contador de balas en la UI
        const balasElement = document.getElementById('balas');
        if (balasElement) {
            balasElement.textContent = `Balas: ${this.balas}/${this.balasMaximas}`;
        }
    }

    mostrarMensaje(mensaje) {
        // Crear elemento de mensaje temporal
        const mensajeElement = document.createElement('div');
        mensajeElement.textContent = mensaje;
        mensajeElement.style.cssText = `
            position: absolute;
            bottom: 40px;
            right: 40px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(mensajeElement);
        // Remover el mensaje después de 2 segundos
        setTimeout(() => {
            if (mensajeElement.parentNode) {
                mensajeElement.parentNode.removeChild(mensajeElement);
            }
        }, 2000);
    }

    obtenerPosicion() {
        return this.mesh ? this.mesh.position.clone() : new THREE.Vector3();
    }
} 