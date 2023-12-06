export interface ICustomPlatform {
  postSynth(config: any): any;
  preSynth(app: any): void;
}