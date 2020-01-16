'use strict';

const AppTextures = {
    callbacks: {},
    three: {},
    materials: {},

    Load: function () {
        let self = this;
        for (let textureName in AppTexturesGenerated) {
            let textureNameFlip = "flip_" + textureName;
            let image = document.createElement('img');
            let texture = new THREE.Texture();
            let textureFlip = new THREE.Texture();

            self.three[textureName] = texture;
            self.three[textureNameFlip] = textureFlip;

            self.materials[textureName] = new THREE.SpriteMaterial({ map: texture, color: 0xffffff, fog: false });
            self.materials[textureNameFlip] = new THREE.SpriteMaterial({ map: textureFlip, color: 0xffffff, fog: false });

            texture.image = image;
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;

            textureFlip.image = image;
            textureFlip.minFilter = THREE.NearestFilter;
            textureFlip.magFilter = THREE.NearestFilter;
            textureFlip.wrapS = THREE.RepeatWrapping;
            textureFlip.repeat.x = -1;

            image.onload = function () {
                let scopeTextureName = textureName;
                let scopeTextureNameFlip = textureNameFlip;
                let scopeTexture = texture;
                let scopeTextureFlip = textureFlip;
                return function () {
                    scopeTexture.needsUpdate = true;
                    if (self.callbacks.hasOwnProperty(scopeTextureName)) {
                        self.callbacks[scopeTextureName](scopeTexture);
                    }

                    scopeTextureFlip.needsUpdate = true;
                    if (self.callbacks.hasOwnProperty(scopeTextureNameFlip)) {
                        self.callbacks[scopeTextureNameFlip](scopeTextureFlip);
                    }
                }
            }();
            image.src = AppTexturesGenerated[textureName];
        }
    }
}