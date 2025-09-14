import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { DEFAULT_MODELS } from '../constants.js';
import { Icon } from '../components/Icons.js';
const { useState } = React;

const ModelModal = ({ isOpen, onClose, onSave, model: editingModel, existingModels }) => {
    const [name, setName] = useState('');
    const [apiType, setApiType] = useState('OpenAI / OpenAI Compatible APIs / Ollama');
    const [apiKey, setApiKey] = useState('');
    const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
    const [model, setModel] = useState('');
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [supportImage, setSupportImage] = useState('No');
    const [contextWindow, setContextWindow] = useState('8000');
    const [temperature, setTemperature] = useState('0.7');
    const [errors, setErrors] = useState({});
    const isEditing = !!editingModel;

    React.useEffect(() => {
        if (isOpen) {
            setName(editingModel?.name || '');
            setApiType(editingModel?.apiType || 'OpenAI / OpenAI Compatible APIs / Ollama');
            setApiKey(editingModel?.apiKey || '');
            setModel(editingModel?.model || '');
            setApiBaseUrl(editingModel?.apiBaseUrl || '');
            setSupportImage(editingModel?.supportImage ? 'Yes' : 'No');
            setContextWindow(String(editingModel?.contextWindow || '8000'));
            setTemperature(String(editingModel?.temperature || '0.7'));
            setErrors({});
        }
    }, [isOpen, editingModel]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) {
            newErrors.name = 'Name is required.';
        } else if (existingModels.some(m => m.name.trim().toLowerCase() === name.trim().toLowerCase() && m.id !== editingModel?.id)) {
            newErrors.name = 'A model with this name already exists.';
        }
        if (!apiKey.trim()) newErrors.apiKey = 'API Key is required.';
        if (!model.trim()) newErrors.model = 'Model is required.';
        if (!apiBaseUrl.trim()) newErrors.apiBaseUrl = 'API Base URL is required.';
        if (isNaN(Number(contextWindow))) newErrors.contextWindow = 'Must be a number.';
        if (isNaN(Number(temperature))) newErrors.temperature = 'Must be a number.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onSave({
            name: name.trim(),
            apiType,
            apiKey: apiKey.trim(),
            model: model.trim(),
            apiBaseUrl: apiBaseUrl.trim(),
            supportImage: supportImage === 'Yes',
            contextWindow: parseInt(contextWindow, 10),
            temperature: parseFloat(temperature),
        });
        onClose();
    };

    const inputClasses = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
    const selectClasses = inputClasses + " appearance-none";
    const labelClasses = "block text-sm font-medium text-gray-700";

    const renderError = (field) => errors[field] ? React.createElement('p', { className: "text-xs text-red-500 mt-1" }, errors[field]) : null;

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 backdrop-blur-sm", 'aria-modal': "true", role: "dialog" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-200 flex flex-col max-h-full" },
                React.createElement('div', { className: "flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0" },
                    React.createElement('h2', { className: "text-lg font-semibold text-gray-800" }, isEditing ? 'Edit Model' : 'Add Model Configuration'),
                    React.createElement('button', { onClick: onClose, className: "text-gray-400 hover:text-gray-600" },
                        React.createElement('svg', { xmlns: "/vendor/svg-b0568748", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }))
                    )
                ),
                React.createElement('div', { className: "p-6 space-y-4 overflow-y-auto" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "name", className: labelClasses }, React.createElement('span', { className: "text-red-500 mr-1" }, "*"), "Name"),
                        React.createElement('input', { type: "text", id: "name", value: name, onChange: e => setName(e.target.value), className: inputClasses, placeholder: "Give your model configuration a name" }),
                        renderError('name')
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "apiType", className: labelClasses }, React.createElement('span', { className: "text-red-500 mr-1" }, "*"), "API Type"),
                        React.createElement('div', { className: "relative" }, React.createElement('select', { id: "apiType", value: apiType, onChange: e => setApiType(e.target.value), className: selectClasses }, React.createElement('option', null, "OpenAI / OpenAI Compatible APIs / Ollama")), React.createElement('div', { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" }, React.createElement('svg', { className: "fill-current h-4 w-4", xmlns: "/vendor/svg-b0568748", viewBox: "0 0 20 20" }, React.createElement('path', { d: "M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" }))))
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "apiKey", className: labelClasses }, React.createElement('span', { className: "text-red-500 mr-1" }, "*"), "API Key"),
                        React.createElement('div', { className: "relative" }, React.createElement('input', { type: isApiKeyVisible ? 'text' : 'password', id: "apiKey", value: apiKey, onChange: e => setApiKey(e.target.value), className: inputClasses, placeholder: "sk-..." }), React.createElement('button', { onClick: () => setIsApiKeyVisible(!isApiKeyVisible), className: "absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" }, React.createElement(Icon, { name: isApiKeyVisible ? 'EyeSlashIcon' : 'EyeIcon', className: "w-5 h-5" }))),
                        React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, "Your API key will be stored locally and securely"),
                        React.createElement('p', { className: "text-xs text-gray-500" }, React.createElement('strong', { className: "text-blue-600" }, "For local Ollama"), ", API key is required but can be any value as it won't be used"),
                        renderError('apiKey')
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "model", className: labelClasses }, React.createElement('span', { className: "text-red-500 mr-1" }, "*"), "Model"),
                        React.createElement('input', { type: "text", id: "model", value: model, onChange: e => setModel(e.target.value), className: inputClasses, placeholder: "e.g., gemini-2.5-flash" }),
                        renderError('model')
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "apiBaseUrl", className: labelClasses }, React.createElement('span', { className: "text-red-500 mr-1" }, "*"), "API Base URL"),
                        React.createElement('input', { type: "text", id: "apiBaseUrl", value: apiBaseUrl, onChange: e => setApiBaseUrl(e.target.value), className: inputClasses, placeholder: "https://api.openai.com/v1" }),
                        React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, "Leave empty to use OpenAI's default API endpoint"),
                        React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, React.createElement('strong', { className: "text-blue-600" }, "For local Ollama"), ", default URL is: http://localhost:11434/v1 (port can be customized)"),
                        renderError('apiBaseUrl')
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "supportImage", className: labelClasses }, "Support Image ", React.createElement('button', { className: "align-middle" }, React.createElement(Icon, { name: "QuestionMarkCircleIcon", className: "w-4 h-4 text-gray-400" }))),
                        React.createElement('div', { className: "relative" }, React.createElement('select', { id: "supportImage", value: supportImage, onChange: e => setSupportImage(e.target.value), className: selectClasses }, React.createElement('option', null, "No"), React.createElement('option', null, "Yes")), React.createElement('div', { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" }, React.createElement('svg', { className: "fill-current h-4 w-4", xmlns: "/vendor/svg-b0568748", viewBox: "0 0 20 20" }, React.createElement('path', { d: "M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" }))))
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "contextWindow", className: labelClasses }, React.createElement('span', { className: "text-red-500 mr-1" }, "*"), "Context Window ", React.createElement('button', { className: "align-middle" }, React.createElement(Icon, { name: "QuestionMarkCircleIcon", className: "w-4 h-4 text-gray-400" }))),
                        React.createElement('input', { type: "number", id: "contextWindow", value: contextWindow, onChange: e => setContextWindow(e.target.value), className: inputClasses }),
                        renderError('contextWindow')
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "temperature", className: labelClasses }, React.createElement('span', { className: "text-red-500 mr-1" }, "*"), "Temperature"),
                        React.createElement('input', { type: "number", step: "0.1", min: "0", max: "2", id: "temperature", value: temperature, onChange: e => setTemperature(e.target.value), className: inputClasses }),
                        React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, "Controls randomness: 0 is focused, 1 is balanced, 2 is creative"),
                        renderError('temperature')
                    )
                ),
                React.createElement('div', { className: "p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg flex-shrink-0" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-800 hover:bg-gray-100 text-sm font-semibold" }, "Cancel"),
                    React.createElement('button', { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 text-sm font-semibold" }, "OK")
                )
            )
        )
    );
};

const Models = () => {
    const [models, setModels] = useLocalStorage('ai_models', DEFAULT_MODELS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState(null);

    const handleSaveModel = (modelData) => {
        if (editingModel) {
            setModels(prev => prev.map(m => (m.id === editingModel.id ? { ...m, ...modelData, isDefault: false } : m)));
        } else {
            const newModel = {
                id: Date.now().toString(),
                isDefault: false,
                ...modelData,
            };
            setModels(prev => [...prev, newModel]);
        }
        setEditingModel(null);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this model?")) {
            setModels(prev => prev.filter(model => model.id !== id));
        }
    };

    const openModal = (model) => {
        setEditingModel(model);
        setIsModalOpen(true);
    };

    return (
        React.createElement('div', { className: "p-4 bg-gray-50 h-full text-gray-800" },
            React.createElement('h1', { className: "text-xl font-bold mb-4" }, "Manage AI Models"),
            React.createElement('p', { className: "text-gray-600 mb-6" }, "Add or remove AI models available for chat."),

            React.createElement('div', { className: "space-y-2" },
                models.map((model) => (
                    React.createElement('div', {
                        key: model.id,
                        className: "flex items-center p-3 bg-white rounded-lg border border-gray-200"
                    },
                        React.createElement(Icon, { name: "CpuChipIcon", className: "w-6 h-6 text-blue-500 mr-4" }),
                        React.createElement('span', { className: "flex-1 font-medium" }, model.name),
                        model.isDefault ? (
                            React.createElement('div', { className: "flex items-center gap-2" },
                                React.createElement('span', { className: "text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-1 rounded-full" }, "Default"),
                                React.createElement('button', { onClick: () => openModal(model), className: "p-1 hover:bg-gray-100 rounded-full", 'aria-label': "Edit model" },
                                    React.createElement(Icon, { name: "PencilIcon", className: "w-4 h-4 text-gray-500" })
                                )
                            )
                        ) : (
                             React.createElement('div', { className: "flex items-center gap-2" },
                                React.createElement('button', { onClick: () => openModal(model), className: "p-1 hover:bg-gray-100 rounded-full", 'aria-label': "Edit model" },
                                    React.createElement(Icon, { name: "PencilIcon", className: "w-4 h-4 text-gray-500" })
                                ),
                                React.createElement('button', { onClick: () => handleDelete(model.id), className: "p-1 hover:bg-gray-100 rounded-full", 'aria-label': "Delete model" },
                                    React.createElement(Icon, { name: "TrashIcon", className: "w-4 h-4 text-red-500" })
                                )
                            )
                        )
                    )
                ))
            ),

            React.createElement('button', { onClick: () => openModal(null), className: "mt-6 w-full py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors" },
                "Add New Model"
            ),

            React.createElement(ModelModal, {
                isOpen: isModalOpen,
                onClose: () => setIsModalOpen(false),
                onSave: handleSaveModel,
                model: editingModel,
                existingModels: models
            })
        )
    );
};

export default Models;