const WHATSAPP = '5581973449511';

const SECOES = [
  'inicio',
  'sobre',
  'facetas',
  'tratamentos',
  'resultados',
  'primeira-consulta',
  'diferenciais',
  'depoimentos',
  'consultorio',
  'duvidas',
  'contato',
];

const absoluta = (href) => new URL(href, Cypress.config('baseUrl')).href;

describe('Landing page - Dra. Bianka Andrade', () => {
  beforeEach(() => {
    cy.visitarPagina();
  });

  afterEach(() => {
    cy.get('@consoleError').should('not.have.been.called');
  });

  context('SEO e metadados', () => {
    it('tem título, descrição, idioma e canonical', () => {
      cy.document().its('documentElement.lang').should('eq', 'pt-BR');
      cy.title().should('eq', 'Dra. Bianka Andrade | Dentista em Camaragibe · CRO-PE 22523');
      cy.get('meta[name="description"]').should('have.attr', 'content').and('have.length.within', 70, 160);
      cy.get('link[rel="canonical"]')
        .should('have.attr', 'href', 'https://josepachecoqa.github.io/dra-bianka-andrade/');
      cy.get('meta[name="viewport"]').should('have.attr', 'content').and('include', 'width=device-width');
    });

    it('tem Open Graph completo com imagem 1200x630', () => {
      ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'og:type'].forEach((prop) => {
        cy.get(`meta[property="${prop}"]`).should('have.attr', 'content').and('not.be.empty');
      });
      cy.get('meta[property="og:image:width"]').should('have.attr', 'content', '1200');
      cy.get('meta[property="og:image:height"]').should('have.attr', 'content', '630');
      cy.request(absoluta('assets/img/og-image.jpg')).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.headers['content-type']).to.include('image/jpeg');
      });
    });

    it('dados estruturados descrevem a clínica como Dentist', () => {
      cy.get('script[type="application/ld+json"]').then(($s) => {
        const dados = JSON.parse($s.text());
        expect(dados['@type']).to.eq('Dentist');
        expect(dados.telephone.replace(/\D/g, '')).to.eq(WHATSAPP);
        expect(dados.email).to.eq('dra.biankaandrade@gmail.com');
        expect(dados.address).to.include({
          addressLocality: 'Camaragibe',
          addressRegion: 'PE',
          postalCode: '54774-000',
        });
        expect(dados.openingHoursSpecification).to.have.length(2);
        expect(dados.sameAs).to.include('https://www.instagram.com/dra.biankaandrade/');
      });
    });

    it('favicon e sitemap estão publicados', () => {
      cy.get('link[rel="icon"]').should('have.attr', 'href', 'favicon.svg');
      cy.request(absoluta('favicon.svg')).its('status').should('eq', 200);
      cy.request(absoluta('sitemap.xml')).its('body').should('include', '<loc>https://josepachecoqa.github.io/dra-bianka-andrade/</loc>');
    });
  });

  context('Estrutura', () => {
    it('tem um único h1 e todas as seções na ordem certa', () => {
      cy.get('h1').should('have.length', 1).and('contain.text', 'precisão e carinho');
      cy.get('main > section').then(($secoes) => {
        expect([...$secoes].map((s) => s.id)).to.deep.eq(SECOES);
      });
      cy.get('main section:not(#inicio)').each(($secao) => {
        cy.wrap($secao).find('h2').should('have.length.at.least', 1);
      });
    });

    it('link "pular para o conteúdo" aponta para o main', () => {
      cy.get('.skip-link').should('have.attr', 'href', '#conteudo');
      cy.get('main#conteudo').should('exist');
    });

    it('todos os links internos apontam para elementos existentes', () => {
      cy.get('a[href^="#"]').each(($a) => {
        const alvo = $a.attr('href');
        cy.get(alvo).should('exist');
      });
    });

    it('todos os arquivos locais (css, js, imagens) respondem 200', () => {
      cy.document().then((doc) => {
        const urls = new Set();
        doc.querySelectorAll('link[href], script[src], img[src], source[srcset]').forEach((el) => {
          const valor = el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('srcset');
          const url = new URL(valor, doc.baseURI);
          if (url.origin === new URL(doc.baseURI).origin) urls.add(url.href);
        });
        expect(urls.size).to.be.greaterThan(8);
        urls.forEach((url) => cy.request(url).its('status').should('eq', 200));
      });
    });
  });

  context('Navegação', () => {
    it('cada item do menu leva à sua seção e fica ativo', () => {
      ['sobre', 'tratamentos', 'resultados', 'consultorio', 'duvidas'].forEach((id) => {
        cy.get(`.nav-menu a[href="#${id}"]`).click();
        cy.get(`#${id}`).should(($s) => {
          const topo = $s[0].getBoundingClientRect().top;
          expect(topo).to.be.within(-5, 120);
        });
        cy.get(`.nav-menu a[href="#${id}"]`).should('have.class', 'is-active');
      });
    });

    it('navbar ganha sombra ao rolar a página', () => {
      cy.get('.navbar').should('not.have.class', 'is-scrolled');
      cy.scrollTo(0, 400);
      cy.get('.navbar').should('have.class', 'is-scrolled');
    });

    it('elementos aparecem com animação ao rolar', () => {
      cy.get('#diferenciais .reveal').first().should('not.have.class', 'is-visible');
      cy.get('#diferenciais').scrollIntoView();
      cy.get('#diferenciais .reveal').first().should('have.class', 'is-visible');
    });

    it('botão "Ver tratamentos" do hero leva à seção', () => {
      cy.get('.hero .btn-secondary').click();
      cy.location('hash').should('eq', '#tratamentos');
    });
  });

  context('Links externos', () => {
    it('todos abrem em nova aba com rel seguro', () => {
      cy.get('a[href^="http"]').should('have.length.at.least', 8).each(($a) => {
        expect($a.attr('target'), $a.attr('href')).to.eq('_blank');
        expect($a.attr('rel'), $a.attr('href')).to.include('noopener').and.include('noreferrer');
      });
    });

    it('WhatsApp: número dela e mensagem pronta em todos os botões', () => {
      cy.get('[data-whatsapp]').should('have.length', 6).each(($a) => {
        const url = new URL($a.attr('href'));
        expect(url.origin + url.pathname).to.eq(`https://wa.me/${WHATSAPP}`);
        expect(url.searchParams.get('text')).to.match(/Dra\.\sBianka|facetas|urgência/i);
      });
      cy.get('.tratamento-urgencia [data-whatsapp]').then(($a) => {
        expect(new URL($a.attr('href')).searchParams.get('text')).to.include('urgência');
      });
      cy.get('#facetas [data-whatsapp]').then(($a) => {
        expect(new URL($a.attr('href')).searchParams.get('text')).to.include('facetas');
      });
    });

    it('botão flutuante do WhatsApp está sempre visível', () => {
      cy.get('.whatsapp-float').should('be.visible').and('have.attr', 'aria-label');
      cy.scrollTo('bottom');
      cy.get('.whatsapp-float').should('be.visible');
    });

    it('Instagram, e-mail e mapa do consultório', () => {
      cy.get('a[href="https://www.instagram.com/dra.biankaandrade/"]').should('contain.text', '@dra.biankaandrade');
      cy.get('a[href="mailto:dra.biankaandrade@gmail.com"]').should('exist');
      cy.get('a[href^="https://www.google.com/maps/search/"]').should('have.length.at.least', 1).each(($a) => {
        expect(new URL($a.attr('href')).searchParams.get('query')).to.include('Belmino Correia');
      });
      cy.get('#consultorio iframe')
        .should('have.attr', 'title')
        .and('include', 'Innovar');
      cy.get('#consultorio iframe').should('have.attr', 'src').and('include', 'output=embed');
    });
  });

  context('Conteúdo do briefing', () => {
    it('identidade, formação e números', () => {
      cy.get('.navbar').should('contain.text', 'CRO-PE 22523');
      cy.get('#sobre').should('contain.text', 'Estácio')
        .and('contain.text', 'Lentes avançadas em resina composta')
        .and('contain.text', 'EPO 2025');
      cy.get('.stat-number').then(($n) => {
        expect([...$n].map((n) => n.textContent.trim())).to.deep.eq(['+300', '16', '1º']);
      });
    });

    it('lista os 16 tratamentos, igual ao número em destaque', () => {
      cy.get('.tratamento-card:not(.tratamento-urgencia) li').should('have.length', 16);
    });

    it('consultório: equipe, horários e endereço', () => {
      cy.get('#consultorio')
        .should('contain.text', 'Innovar Odontologia Integrada')
        .and('contain.text', 'Dra. Marcella Vieira · CRO-PE 22610')
        .and('contain.text', 'Av. Dr. Belmino Correia, 3410')
        .and('contain.text', 'CEP 54774-000')
        .and('contain.text', 'Estacionamento');
      cy.get('.horarios dt').then(($dt) => {
        expect([...$dt].map((d) => d.textContent)).to.deep.eq(['Segunda a sexta', 'Sábado']);
      });
      cy.get('.horarios dd').then(($dd) => {
        expect([...$dd].map((d) => d.textContent)).to.deep.eq(['7h às 18h', '8h às 12h']);
      });
    });

    it('carro-chefe, depoimento e contato', () => {
      cy.get('#facetas').should('contain.text', 'Facetas em resina');
      cy.get('.elogio').should('contain.text', 'Atenciosa, perfeccionista e acolhedora');
      cy.get('.contato-link').should('have.length', 3);
      cy.get('.contato-link-primary').should('contain.text', '(81) 97344-9511');
    });

    it('rodapé com nome completo, CRO e ano atual', () => {
      cy.get('footer')
        .should('contain.text', 'Dra. Bianka Vital Andrade dos Santos')
        .and('contain.text', 'CRO-PE 22523');
      cy.get('#ano').should('have.text', String(new Date().getFullYear()));
    });

    it('dúvidas frequentes: todas abrem com resposta', () => {
      cy.get('#duvidas details').should('have.length', 6).each(($d) => {
        cy.wrap($d).find('summary').scrollIntoView().click();
        cy.wrap($d).should('have.attr', 'open');
        cy.wrap($d).find('p').should('be.visible').invoke('text').should('have.length.greaterThan', 40);
        cy.wrap($d).find('summary').click();
        cy.wrap($d).should('not.have.attr', 'open');
      });
    });
  });

  context('Regras de publicidade do CFO', () => {
    it('não usa "especialista", não exibe preços nem promoções', () => {
      cy.get('body').invoke('text').then((texto) => {
        const t = texto.toLowerCase();
        expect(t).not.to.include('especialista');
        expect(t).not.to.match(/r\$\s?\d/);
        expect(t).not.to.match(/promoção|desconto|grátis|gratuit/);
      });
    });

    it('antes e depois traz aviso de autorização e de que resultados variam', () => {
      cy.get('.resultado').should('have.length', 4);
      cy.get('.resultados-nota')
        .should('contain.text', 'autorização por escrito')
        .and('contain.text', 'resultados variam');
    });

    it('CRO aparece no topo, no consultório e no rodapé', () => {
      ['.navbar', '#consultorio', 'footer'].forEach((area) => {
        cy.get(area).should('contain.text', 'CRO-PE 22523');
      });
    });
  });

  context('Imagens', () => {
    it('todas carregam, têm alt e não ficam distorcidas', () => {
      cy.revelarTudo();
      cy.get('img').should('have.length', 6).each(($img) => {
        cy.wrap($img).scrollIntoView();
        cy.wrap($img).should(($el) => {
          const img = $el[0];
          const nome = img.getAttribute('src');
          expect(img.complete && img.naturalWidth, nome).to.be.greaterThan(0);
          expect(img.alt.length, `alt de ${nome}`).to.be.greaterThan(15);
          const cover = getComputedStyle(img).objectFit === 'cover';
          if (!cover) {
            const r = img.getBoundingClientRect();
            const proporcaoTela = r.width / r.height;
            const proporcaoReal = img.naturalWidth / img.naturalHeight;
            expect(Math.abs(proporcaoTela - proporcaoReal), `proporção de ${nome}`).to.be.lessThan(0.02);
          }
        });
      });
    });

    it('usa WebP com fallback JPG', () => {
      cy.get('picture').should('have.length', 6).each(($p) => {
        cy.wrap($p).find('source[type="image/webp"]').should('have.attr', 'srcset').and('match', /\.webp$/);
        cy.wrap($p).find('img').should('have.attr', 'src').and('match', /\.jpg$/);
      });
    });
  });

  context('Acessibilidade', () => {
    it('sem violações graves ou críticas (axe)', () => {
      cy.revelarTudo();
      cy.injectAxe();
      cy.checkA11y(null, { includedImpacts: ['serious', 'critical'] }, (violacoes) => {
        violacoes.forEach((v) => {
          cy.task('log', `${v.impact} ${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        });
      });
    });
  });
});

describe('Landing page - responsivo', () => {
  [
    { nome: 'celular pequeno', largura: 360, altura: 740 },
    { nome: 'celular', largura: 390, altura: 844 },
    { nome: 'tablet', largura: 768, altura: 1024 },
    { nome: 'desktop largo', largura: 1440, altura: 900 },
  ].forEach(({ nome, largura, altura }) => {
    it(`sem rolagem horizontal em ${nome} (${largura}px)`, () => {
      cy.viewport(largura, altura);
      cy.visitarPagina();
      cy.revelarTudo();
      cy.scrollTo('bottom');
      cy.document().then((doc) => {
        const el = doc.documentElement;
        expect(el.scrollWidth, 'scrollWidth').to.be.at.most(el.clientWidth + 1);
      });
    });
  });

  context('menu no celular', () => {
    beforeEach(() => {
      cy.viewport(390, 844);
      cy.visitarPagina();
    });

    it('botão do menu fica no canto direito', () => {
      cy.get('.nav-toggle').should('be.visible').then(($b) => {
        const larguraUtil = $b[0].ownerDocument.documentElement.clientWidth;
        expect(larguraUtil - $b[0].getBoundingClientRect().right).to.be.lessThan(24);
      });
      cy.get('.nav-menu').should('not.be.visible');
    });

    it('abre, navega para a seção e fecha', () => {
      cy.get('.nav-toggle').should('have.attr', 'aria-expanded', 'false').click();
      cy.get('.nav-toggle')
        .should('have.attr', 'aria-expanded', 'true')
        .and('have.attr', 'aria-label', 'Fechar menu');
      cy.get('.nav-menu').should('be.visible').contains('a', 'Consultório').click();
      cy.get('.nav-menu').should('not.be.visible');
      cy.get('.nav-toggle').should('have.attr', 'aria-expanded', 'false');
      cy.location('hash').should('eq', '#consultorio');
    });

    it('fecha com Esc e devolve o foco ao botão', () => {
      cy.get('.nav-toggle').click();
      cy.get('.nav-menu').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('.nav-menu').should('not.be.visible');
      cy.focused().should('have.class', 'nav-toggle');
    });

    it('botão Agendar do menu abre o WhatsApp', () => {
      cy.get('.nav-toggle').click();
      cy.get('.nav-menu .cta-link').should('be.visible').and('have.attr', 'href').and('include', `wa.me/${WHATSAPP}`);
    });
  });
});
