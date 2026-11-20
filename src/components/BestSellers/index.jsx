export default function BestSellers() {
  const produtos = [
    { id: 1, nome: "Lakers Jersey", preco: "R$ 299,90", time: "Lakers" },
    { id: 2, nome: "Warriors Jersey", preco: "R$ 289,90", time: "Warriors" },
    { id: 3, nome: "Bulls Jersey", preco: "R$ 279,90", time: "Bulls" },
    { id: 4, nome: "Celtics Jersey", preco: "R$ 295,90", time: "Celtics" }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            {produtos.map((produto) => (
              <div key={produto.id} className="bg-gray-100 rounded-lg p-6 text-center hover:shadow-lg transition-shadow w-full max-w-sm">
                <div className="bg-primary h-48 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{produto.time}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{produto.nome}</h3>
                <p className="text-primary font-bold text-xl">{produto.preco}</p>
                <button className="mt-4 bg-secondary text-primary px-6 py-2 rounded-lg hover:bg-secondary-dark transition-colors">
                  Comprar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
