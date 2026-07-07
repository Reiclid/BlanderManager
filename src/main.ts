import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface ModelData {
  link: string;
  data: Record<string, unknown>;
}

export class CardModel {
  private main = document.querySelector('main');
  private models = Object.keys(import.meta.glob('/src/assets/models/*.fbx'));

  constructor() {
    this.initCards();
  }

  private init3Dscene(linkModel: string, card: HTMLDivElement) {
    const width = 300;
    const height = 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    card.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const loader = new FBXLoader();
    let loadedModel: THREE.Group | null = null;

    loader.load(
      linkModel,
      (fbx: THREE.Group) => {
        const modelGroup = new THREE.Group();

        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child.clone() as THREE.Mesh;
            modelGroup.add(mesh);
          }
        });

        if (modelGroup.children.length === 0) {
          console.error(`У файлі ${linkModel} не знайдено 3D-геометрії (Mesh)`);
          scene.add(fbx);
          return;
        }

        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        modelGroup.children.forEach((child) => {
          if (child instanceof THREE.Object3D) {
            child.position.sub(center);
          }
        });

        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredSize = 18;
        const scaleFactor = desiredSize / maxDim;
        modelGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

        scene.add(modelGroup);
        loadedModel = modelGroup as any;

        console.log(`Модель ${linkModel} успішно завантажена разом із текстурами та відцентрована!`);
      },
      (xhr: ProgressEvent) => {
        if (xhr.total > 0) {
          console.log(`${linkModel}: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% завантажено`);
        }
      },
      (error: unknown) => {
        console.error('Помилка завантаження моделі:', error);
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);

      if (loadedModel) {
        loadedModel.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();
  }

  public initCards() {
    if (!this.main) return;

    for (const modelPath of this.models) {
      const block = document.createElement('div');
      block.className = 'model-item';

      const title = document.createElement('p');
      title.textContent = modelPath.split('/').pop() || 'Модель';
      block.appendChild(title);

      this.init3Dscene(modelPath, block);

      this.main.appendChild(block);
    }
  }
}

new CardModel();