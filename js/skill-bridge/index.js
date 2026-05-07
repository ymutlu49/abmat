/* ABMATO — Beceri Köprüsü: Factory
   Bağımlılıkları bir araya getirir ve çalışmaya hazır bir SkillBridgeApp döndürür. */

import { SkillProgressStore } from './SkillProgressStore.js';
import { SkillRepository }    from './SkillRepository.js';
import { SkillProgressService } from './SkillProgressService.js';
import { SkillBridgeView }    from './SkillBridgeView.js';
import { SkillBridgeApp }     from './SkillBridgeApp.js';
import { SB_MODULLER, SB_BOLUM_META } from './data.js';

export function createSkillBridge({ containerEl, storage = localStorage, namespace = 'matevde' }) {
  const store       = new SkillProgressStore(storage, namespace);
  const repo        = new SkillRepository(SB_MODULLER);
  const progressSvc = new SkillProgressService(store, repo);

  const view = new SkillBridgeView({
    container:   containerEl,
    progressSvc,
    repo,
    bolumMeta:   SB_BOLUM_META,
    onOpen:      id => app.openModule(id),
    onClose:     ()  => app.back(),
  });

  // view.container'ı ayarla (render metodları içinde kullanmak için)
  view.container = containerEl;

  const app = new SkillBridgeApp({ view, progressSvc });
  return app;
}
