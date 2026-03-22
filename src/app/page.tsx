import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-warm-50/80 backdrop-blur-sm border-b border-warm-200/60">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-warm-800 font-semibold tracking-tight">
            livros do otávio
          </Link>
          <Link
            href="/loja"
            className="text-sm text-warm-600 hover:text-warm-900 transition-colors"
          >
            ver acervo
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-lg">
          <p className="text-olive-600 text-sm font-medium mb-4 tracking-wide uppercase">
            Acervo pessoal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-warm-900 leading-tight tracking-tight">
            Livros e apostilas usados, com preço justo.
          </h1>
          <p className="mt-4 text-warm-500 text-lg leading-relaxed">
            Estou vendendo meu acervo pessoal de livros e apostilas de cursinho.
            Tudo organizado, com fotos reais e compra simplificada pelo WhatsApp.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/loja"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-warm-900 text-warm-50 rounded-xl font-medium hover:bg-warm-800 active:scale-[0.98] transition-all text-base"
            >
              Ver livros disponíveis
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-5">
        <hr className="border-warm-200" />
      </div>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-sm font-medium text-warm-400 uppercase tracking-wide mb-10">
          Como funciona
        </h2>
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
          <div>
            <div className="w-10 h-10 rounded-full bg-olive-100 text-olive-700 flex items-center justify-center text-sm font-semibold mb-4">
              1
            </div>
            <h3 className="font-semibold text-warm-800 mb-1">Escolha os livros</h3>
            <p className="text-warm-500 text-sm leading-relaxed">
              Navegue pelo acervo, veja fotos e detalhes de cada item.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-olive-100 text-olive-700 flex items-center justify-center text-sm font-semibold mb-4">
              2
            </div>
            <h3 className="font-semibold text-warm-800 mb-1">Adicione ao carrinho</h3>
            <p className="text-warm-500 text-sm leading-relaxed">
              Monte sua lista com tudo que quiser. Sem pressa, sem cadastro.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-olive-100 text-olive-700 flex items-center justify-center text-sm font-semibold mb-4">
              3
            </div>
            <h3 className="font-semibold text-warm-800 mb-1">Finalize pelo WhatsApp</h3>
            <p className="text-warm-500 text-sm leading-relaxed">
              Uma mensagem pronta é gerada com seus livros. A gente combina tudo por lá.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-5">
        <hr className="border-warm-200" />
      </div>

      {/* Differentials */}
      <section className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-warm-100/60 rounded-2xl p-5">
            <p className="text-warm-800 font-semibold text-sm mb-1">Fotos reais</p>
            <p className="text-warm-500 text-sm">
              Cada livro tem foto do próprio exemplar que você vai receber.
            </p>
          </div>
          <div className="bg-warm-100/60 rounded-2xl p-5">
            <p className="text-warm-800 font-semibold text-sm mb-1">Preços acessíveis</p>
            <p className="text-warm-500 text-sm">
              Livros usados em bom estado a partir de R$&nbsp;5,00.
            </p>
          </div>
          <div className="bg-warm-100/60 rounded-2xl p-5">
            <p className="text-warm-800 font-semibold text-sm mb-1">Sem burocracia</p>
            <p className="text-warm-500 text-sm">
              Sem cadastro, sem login. Só escolher e combinar pelo WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-5 pb-20 sm:pb-28 text-center">
        <h2 className="text-2xl font-bold text-warm-900 mb-3">
          Pronto pra dar uma olhada?
        </h2>
        <p className="text-warm-500 mb-6">
          Veja o que tenho disponível e monte seu pedido.
        </p>
        <Link
          href="/loja"
          className="inline-flex items-center justify-center px-8 py-4 bg-warm-900 text-warm-50 rounded-xl font-medium hover:bg-warm-800 active:scale-[0.98] transition-all text-base"
        >
          Ver livros disponíveis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200 py-8">
        <div className="max-w-3xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-warm-400">
          <p>livros do otávio</p>
          <p>feito com carinho para desapegar dos livros</p>
        </div>
      </footer>
    </div>
  );
}
