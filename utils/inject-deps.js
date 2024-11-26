const injectDeps = (BaseClass) => {
    return class TextureDecorator extends BaseClass {
        constructor(config) {
            super(config);
            this._validateConfig(config);
            this.textureMapper = config.textureMapper;
        }

        _validateConfig(config) {
            if (!config.textureMapper) {
                throw new Error('TextureMapper is required');
            }
        }

        render(ctx) {
            if (!this.textureMapper) {
                throw new Error('TextureMapper not initialized');
            }
            super.render(ctx);
        }
    };
};
