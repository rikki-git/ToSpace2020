'use strict';

const AppTextures = {
    callbacks: {},
    three: {},
    materials: {},

    Load: function () {
        let self = this;
        for (let textureName in AppTexturesGenerated) {
            let image = document.createElement('img');
            let texture = new THREE.Texture();
            self.three[textureName] = texture;
            self.materials[textureName] = new THREE.SpriteMaterial({ map: texture, color: 0xffffff, fog: false });
            texture.image = image;
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            image.onload = function () {
                let scopeTextureName = textureName;
                let scopeTexture = texture;
                return function () {
                    scopeTexture.needsUpdate = true;
                    if (self.callbacks.hasOwnProperty(scopeTextureName)) {
                        self.callbacks[scopeTextureName](scopeTexture);
                    }
                }
            }();
            image.src = AppTexturesGenerated[textureName];
        }
    }
}