import fs from 'node:fs/promises';
import path from 'node:path';
import Sqrl from 'squirrelly';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const log = console.log;

!(async function () {
  try {
    const pages = await fs.readdir(path.resolve('./src/pages'));
    const layouts = await Promise.all(
      pages.map(async (page) => {
        const [template, App] = await Promise.all([
          fs.readFile(`./src/pages/${page}/template.html`, { encoding: 'utf8' }),
          import(`./pages/${page}`),
        ]);
        const app = renderToStaticMarkup(createElement(App.default, { page }, null));
        return { payload: Sqrl.render(template, { app, page }, { autoEscape: false }), fileName: `${page}.html` };
      })
    );

    await fs.rm('./generated', { recursive: true, force: true }).catch()
    await fs.mkdir('./generated')
    await Promise.all(
      layouts.map((layout) => fs.writeFile(path.resolve(`./generated/${layout.fileName}`), layout.payload))
    );
  } catch (e) {
    log(e);
  }
})();
