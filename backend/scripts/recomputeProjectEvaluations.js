"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var createPrismaClient_1 = require("../src/lib/createPrismaClient");
var projectEvaluation_1 = require("../src/lib/projectEvaluation");
var prisma = (0, createPrismaClient_1.createPrismaClient)();
function toPrismaStatus(status) {
    switch (status) {
        case 'Red':
            return 'RED';
        case 'Green':
            return 'GREEN';
        default:
            return 'AMBER';
    }
}
function recompute() {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, openAIApiKey, model, openAIModel, mock, projects, _i, projects_1, project, evaluation, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    apiKey = process.env.GEMINI_API_KEY;
                    openAIApiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey && !openAIApiKey) {
                        throw new Error('An API key for either Gemini or OpenAI must be set to run the project evaluation recompute script.');
                    }
                    model = process.env.GEMINI_MODEL || process.env.MODEL;
                    openAIModel = process.env.OPENAI_MODEL;
                    mock = process.env.MOCK_PROJECT_EVALUATION === 'true';
                    return [4 /*yield*/, prisma.project.findMany({
                            where: {
                                OR: [{ latitude: null }, { longitude: null }],
                            },
                            include: {
                                evidence: {
                                    orderBy: {
                                        datePublished: 'desc',
                                    },
                                },
                                region: true,
                                localAuthority: true,
                            },
                        })];
                case 1:
                    projects = _c.sent();
                    console.log("Found ".concat(projects.length, " projects to evaluate."));
                    _i = 0, projects_1 = projects;
                    _c.label = 2;
                case 2:
                    if (!(_i < projects_1.length)) return [3 /*break*/, 8];
                    project = projects_1[_i];
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, (0, projectEvaluation_1.evaluateProjectWithGemini)({
                            projectName: project.title,
                            projectDescription: project.description || undefined,
                            locale: ((_a = project.region) === null || _a === void 0 ? void 0 : _a.name) || undefined,
                            evidence: project.evidence.map(function (item) { return ({
                                title: item.title || undefined,
                                summary: item.summary || undefined,
                                source: item.source || undefined,
                                sourceUrl: item.url || undefined,
                                evidenceDate: item.datePublished
                                    ? item.datePublished.toISOString().slice(0, 10)
                                    : undefined,
                                rawText: item.description || undefined,
                            }); }),
                        }, {
                            apiKey: apiKey,
                            openAIApiKey: openAIApiKey,
                            model: model || undefined,
                            openAIModel: openAIModel || undefined,
                            mockResponse: mock,
                        })];
                case 4:
                    evaluation = _c.sent();
                    console.log("Updating ".concat(project.title, " -> status ").concat(evaluation.ragStatus, " (").concat(evaluation.ragRationale || 'no rationale', ")"));
                    return [4 /*yield*/, prisma.project.update({
                            where: { id: project.id },
                            data: {
                                status: toPrismaStatus(evaluation.ragStatus),
                                statusRationale: evaluation.ragRationale,
                                statusUpdatedAt: new Date(),
                                latitude: evaluation.latitude,
                                longitude: evaluation.longitude,
                                locationDescription: evaluation.locationDescription || null,
                                locationSource: evaluation.locationSource || null,
                                locationConfidence: (_b = evaluation.locationConfidence) !== null && _b !== void 0 ? _b : null,
                            },
                        })];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _c.sent();
                    console.error("Failed to evaluate project ".concat(project.id, " (").concat(project.title, ")"), error_1);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/];
            }
        });
    });
}
recompute()
    .catch(function (error) {
    console.error('Failed to recompute project evaluations', error);
    process.exitCode = 1;
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
