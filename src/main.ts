import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface ModelData {
  link: string;
  data: Record<string, unknown>;
}

export class CardModel {
  // Використовуємо eagers або стандартний glob. 
  // Object.keys поверне масив відносних шляхів, наприклад: ['/src/assets/models/Fish.fbx']
  private main = document.querySelector('main');
  private models = Object.keys(import.meta.glob('/src/assets/models/*.fbx'));

  constructor() {
    // Автоматично запускаємо створення карток при ініціалізації класу
    this.initCards();
  }

  private init3Dscene(linkModel: string, card: HTMLDivElement) {
    // 1. Розміри для рендерера беремо з картки (наприклад, задані через CSS)
    // Якщо картка ще не в DOM, задамо базовий розмір (наприклад, 300x300)
    const width = 300;
    const height = 300;

    // 2. Сцена, камера і рендерер
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    // Додаємо canvas всередину картки
    card.appendChild(renderer.domElement);

    // 3. Освітлення
    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // 4. Завантаження FBX
    const loader = new FBXLoader();
    let loadedModel: THREE.Group | null = null;

    loader.load(
      linkModel,
      (fbx: THREE.Group) => { // Додали : THREE.Group
        fbx.scale.set(0.1, 0.1, 0.1);
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        fbx.position.sub(center);

        scene.add(fbx);
        loadedModel = fbx;
        console.log(`Модель ${linkModel} успішно завантажена!`);
      },
      (xhr: ProgressEvent) => { // Додали : ProgressEvent
        if (xhr.total > 0) {
          console.log(`${linkModel}: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% завантажено`);
        }
      },
      (error: unknown) => {
        console.error('Помилка завантаження моделі:', error);
      }
    );

    // 5. Цикл анімації (для кожної картки свій)
    const animate = () => {
      requestAnimationFrame(animate);

      // Якщо модель завантажилась — плавно крутимо її
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

      // Створюємо заголовок з назвою файлу
      const title = document.createElement('p');
      title.textContent = modelPath.split('/').pop() || 'Модель';
      block.appendChild(title);

      // Ініціалізуємо 3D сцену всередині цього блоку
      this.init3Dscene(modelPath, block);

      this.main.appendChild(block);
    }
  }
}

// Запуск:
new CardModel();