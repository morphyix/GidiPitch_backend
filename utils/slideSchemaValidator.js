const Ajv = require("ajv");

const slideSchema = {
    type: "object",
    properties: {
        slideType: { type: "string" },
        title: { type: "string" },
        bullets: {
            type: "array",
            items: { type: "string" }
        },
        notes: { type: "string" },
        layout: { type: "string", enum: ["default", "title-bullets", "image-text", "full-image"] },
        images: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    prompt: { type: "string" },
                    caption: { type: "string" }
                },
                required: ["prompt"],
                additionalProperties: true
            }
        }
    },
    required: ["slideType", "title", "bullets", "notes", "layout", "images"],
    additionalProperties: true
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validateSlide = ajv.compile(slideSchema);

const validateSlideSchema = (slideData) => {
    const valid = validateSlide(slideData);
    if (!valid) {
        return { valid: false, errors: validateSlide.errors };
    }
    return { valid: true };
};

module.exports = { validateSlideSchema, slideSchema };