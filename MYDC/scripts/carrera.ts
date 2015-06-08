/// <reference path="typings/angularjs/angular.d.ts" />

"use strict";

module Carrera {
    "use strict";
    export enum ParameterType { route, scope, value }
    export enum RunType { manual, auto, once }
    export enum ModelType { array, singleton, object }
    export class Parameter {
        name: string;
        type: ParameterType;
        value: any;
        required: boolean;
        constructor(name: string, type?: ParameterType, value?: any, required: boolean = false) {
            this.name = name;
            this.type = (type) ? type : ((value) ? ParameterType.value : ParameterType.route);
            this.value = (value) ? value : ((this.type === ParameterType.route) ? name : null);
            this.required = required;
        }
    }
    export class Procedure {
        name: string;
        parameters: Parameter[] = [];
        runType: RunType;
        model: string;
        modelType: ModelType;
        objectRoot: string;
        constructor(
            name: string,
            runType: RunType = RunType.manual,
            model?: string,
            modelType?: ModelType,
            objectRoot?: string) {
            this.name = name;
            this.runType = runType;
            this.model = (model) ? model : undefined;
            this.modelType = (model) ? ((modelType) ? modelType : ((objectRoot) ? ModelType.object : ModelType.array)) : undefined;
            this.objectRoot = (this.modelType === ModelType.object) ? ((this.objectRoot) ? objectRoot : undefined) : undefined;
        }
        empty = () => { return (this.model) ? ((this.modelType === ModelType.array) ? [] : {}) : undefined; }
    }
    export module Controllers {
        "use strict";
        export interface IMainScope extends angular.IScope { procedures?: any; }
        export class Main {
            static $inject: string[] = ["$scope", "$parse"];
            constructor(public $scope: IMainScope, public $parse: angular.IParseService) {
                this.$scope.procedures = {};
            }
            addProcedure = (procedure: Carrera.Procedure, alias?: string) => {
                this.$scope.procedures[alias || procedure.name] = procedure;
                if (procedure.model) {
                    this.$parse(procedure.model).assign(this.$scope.$parent, procedure.empty());
                }
            }
            removeProcedure = (nameOrAlias: string) => {
                if (angular.isDefined(this.$scope.procedures[nameOrAlias])) {
                    var procedure: Carrera.Procedure = this.$scope.procedures[nameOrAlias];
                    if (procedure.model) { this.$parse(procedure.model).assign(this.$scope.$parent, undefined); }
                    delete this.$scope.procedures[nameOrAlias];
                }
            }
        }
        export interface IProcedureScope extends angular.IScope {
            name: string;
            alias: string;
            runType: string;
            model: string;
            modelType: string;
            objectRoot: string;
            procedure: Carrera.Procedure;
        }
        export class Procedure {
            static $inject: string[] = ["$scope"];
            constructor(public $scope: IProcedureScope) {
                this.$scope.procedure = new Carrera.Procedure(
                    this.$scope.name,
                    Carrera.RunType[angular.lowercase(this.$scope.runType)],
                    this.$scope.model,
                    Carrera.ModelType[angular.lowercase(this.$scope.modelType)],
                    this.$scope.objectRoot);
            }
            addParameter = (parameter: Carrera.Parameter) => {
                this.$scope.procedure.parameters.push(parameter);
            }
            removeParameter = (parameter: Carrera.Parameter) => {
                var index = this.$scope.procedure.parameters.indexOf(parameter);
                if (index >= 0) { this.$scope.procedure.parameters.splice(index, 1); }
            }
        }
        export interface IParameterScope extends angular.IScope {
            name: string;
            type: string;
            value: string;
            required: string;
            parameter: Carrera.Parameter;
        }
        export class Parameter {
            static $inject: string[] = ["$scope"];
            constructor(public $scope: IParameterScope) {
                this.$scope.parameter = new Carrera.Parameter(
                    $scope.name,
                    Carrera.ParameterType[angular.lowercase($scope.type)],
                    $scope.value,
                    (angular.lowercase($scope.required) === "true"));
            }
        }
    }
}

var car: angular.IModule = angular.module("carrera", ["templates/carreraTransclude.html"]);

car.directive("car", ["$log", <angular.IDirectiveFactory> function ($log: angular.ILogService) {
    return {
        restrict: "E",
        templateUrl: "templates/carreraTransclude.html",
        transclude: true,
        scope: <Carrera.Controllers.IMainScope> {},
        controller: Carrera.Controllers.Main,
        link: function ($scope: Carrera.Controllers.IMainScope) {
            $scope.$watchCollection("procedures", function (newValue: any, oldValue: any) {
                if (newValue !== oldValue) {
                    $log.debug(JSON.stringify($scope.procedures));
                }
            });
        }
    };
}]);

car.directive("carProc", ["$log", <angular.IDirectiveFactory> function ($log: angular.ILogService) {
    return {
        restrict: "E",
        templateUrl: "templates/carreraTransclude.html",
        transclude: true,
        scope: <Carrera.Controllers.IProcedureScope> {
            name: "@",
            alias: "@",
            runType: "@run",
            model: "@",
            modelType: "@type",
            objectRoot: "@root"
        },
        controller: Carrera.Controllers.Procedure,
        require: "^^car",
        link: function (
            $scope: Carrera.Controllers.IProcedureScope,
            iElement: angular.IAugmentedJQuery,
            iAttrs: angular.IAttributes,
            controller: Carrera.Controllers.Main) {
            controller.addProcedure($scope.procedure, $scope.alias);
            $scope.$on("$destroy", function () {
                controller.removeProcedure($scope.alias || $scope.procedure.name);
            });
        }
    };
}]);

car.directive("carParam", ["$log", <angular.IDirectiveFactory> function ($log: angular.ILogService) {
    return {
        restrict: "E",
        templateUrl: "templates/carreraTransclude.html",
        transclude: true,
        scope: <Carrera.Controllers.IParameterScope> { name: "@", type: "@", value: "@", required: "@" },
        controller: Carrera.Controllers.Parameter,
        require: "^^carProc",
        link: function (
            $scope: Carrera.Controllers.IParameterScope,
            iElement: angular.IAugmentedJQuery,
            iAttrs: angular.IAttributes,
            controller: Carrera.Controllers.Procedure) {
            controller.addParameter($scope.parameter);
            $scope.$on("$destroy", function () {
                controller.removeParameter($scope.parameter);
            });
        }

    };
}]);

angular.module("templates/carreraTransclude.html", [])
    .run(["$templateCache", function ($templateCache: angular.ITemplateCacheService) {
    $templateCache.put("templates/carreraTransclude.html", "<ng-transclude></ng-transclude>");
}]);
