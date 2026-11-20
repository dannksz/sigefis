# Sistema de Notificações Toast

Sistema centralizado de notificações toast para o Hall of Jerseys, substituindo todos os `alert()` por notificações modernas e personalizadas.

## 📦 Estrutura

```
src/components/Toast/
├── index.ts              # Exporta todas as funções
├── notifications.ts      # Funções de notificação
├── ToastProvider.tsx     # Componente provider configurado
├── toast-custom.css      # Estilos personalizados
└── README.md            # Esta documentação
```

## 🎨 Características

- ✅ **Posição**: Canto inferior direito
- ✅ **Auto-close**: 3 segundos (4 para erros)
- ✅ **Progressbar**: Ativada
- ✅ **Draggable**: Permite arrastar
- ✅ **Pause on hover**: Pausa ao passar o mouse
- ✅ **Gradientes personalizados** para cada tipo

## 🚀 Como usar

### Importação

```typescript
import { notifications } from '@/components/Toast';
```

### Funções Básicas

```typescript
// Notificações genéricas
notifications.success('Operação realizada com sucesso!');
notifications.error('Ocorreu um erro!');
notifications.warning('Atenção: isso é um aviso');
notifications.info('Informação importante');
```

### Funções Específicas

#### Carrinho
```typescript
notifications.addedToCart();        // ✅ Produto adicionado ao carrinho!
notifications.removedFromCart();    // 🗑️ Produto removido do carrinho
notifications.cartCleared();         // 🧹 Carrinho limpo
notifications.selectSize();          // 📏 Por favor, selecione um tamanho disponível
```

#### Autenticação
```typescript
notifications.loginRequired();      // 🔒 Você precisa estar logado
notifications.loginSuccess();       // 👋 Bem-vindo de volta!
notifications.loginError();         // ❌ Email ou senha inválidos
notifications.registerSuccess();    // ✅ Cadastro realizado com sucesso!
```

#### Pedidos e Pagamento
```typescript
notifications.orderCreated();       // 🎉 Pedido criado com sucesso!
notifications.orderError();         // ❌ Erro ao criar pedido
notifications.paymentSuccess();     // 💳 Pagamento aprovado!
notifications.paymentError();       // ❌ Erro no pagamento
```

#### Formulários
```typescript
notifications.fillAllFields();      // 📝 Por favor, preencha todos os campos
notifications.invalidData();        // ❌ Dados inválidos
notifications.saveSuccess();        // ✅ Salvo com sucesso!
notifications.saveError();          // ❌ Erro ao salvar
```

#### Avaliações
```typescript
notifications.reviewSuccess();      // ⭐ Avaliação enviada com sucesso!
notifications.reviewError();        // ❌ Erro ao enviar avaliação
```

#### Utilidades
```typescript
notifications.copiedToClipboard();  // 📋 Copiado para área de transferência!
notifications.librasActivated();    // 🤟 Funcionalidade de Libras ativada!
```

#### Cookies e Preferências
```typescript
notifications.cookieSet();          // 🍪 Cookie definido!
notifications.cookieRemoved();      // 🗑️ Cookie removido!
notifications.themeSaved('dark');   // 🎨 Tema dark salvo!
notifications.languageSaved();      // 🌐 Idioma salvo!
```

## 🎨 Tipos de Notificação

### Success (Verde)
- Gradiente: `#10b981` → `#059669`
- Usado para: Operações bem-sucedidas, confirmações

### Error (Vermelho)
- Gradiente: `#ef4444` → `#dc2626`
- Usado para: Erros, falhas, validações negativas

### Warning (Laranja)
- Gradiente: `#f59e0b` → `#d97706`
- Usado para: Avisos, alertas, atenção necessária

### Info (Azul)
- Gradiente: `#3b82f6` → `#2563eb`
- Usado para: Informações gerais, dicas

## 🔧 Configuração

O ToastProvider já está configurado no `src/app/layout.tsx`:

```tsx
import { ToastProvider } from '@/components/Toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NextAuthProvider>
          {children}
          <ToastProvider />
        </NextAuthProvider>
      </body>
    </html>
  );
}
```

## 📝 Exemplos de Uso Real

### Exemplo 1: Adicionar ao Carrinho
```typescript
const adicionarAoCarrinho = async () => {
  if (!session) {
    notifications.loginRequired();
    router.push('/login');
    return;
  }

  if (!selectedSize?.disponivel) {
    notifications.selectSize();
    return;
  }

  try {
    const response = await fetch('/api/carrinho', {
      method: 'POST',
      body: JSON.stringify({ produtoId, quantidade, tamanhoId })
    });

    if (response.ok) {
      notifications.addedToCart();
    } else {
      notifications.error('Erro ao adicionar produto');
    }
  } catch (error) {
    notifications.error('Erro de conexão');
  }
};
```

### Exemplo 2: Processar Pagamento
```typescript
const processarPagamento = async () => {
  try {
    const response = await fetch('/api/pagamento', {
      method: 'POST',
      body: JSON.stringify({ pedidoId, formaPagamento })
    });

    if (response.ok) {
      notifications.paymentSuccess();
      router.push('/perfil/pedidos');
    } else {
      notifications.paymentError();
    }
  } catch (error) {
    notifications.error('Erro ao processar pagamento');
  }
};
```

### Exemplo 3: Copiar PIX
```typescript
const copiarCodigoPix = (codigo: string) => {
  navigator.clipboard.writeText(codigo);
  notifications.copiedToClipboard();
};
```

## 🎯 Migração de Alert

**Antes:**
```typescript
alert('Produto adicionado ao carrinho com sucesso!');
```

**Depois:**
```typescript
notifications.addedToCart();
// ou
notifications.success('Produto adicionado ao carrinho com sucesso!');
```

## 📚 Documentação react-toastify

Para customizações avançadas, consulte a [documentação oficial](https://fkhadra.github.io/react-toastify/introduction).

## 🔍 Localização dos Arquivos Modificados

Todos os arquivos que usavam `alert()` foram atualizados:

- ✅ `src/app/produtos/[id]/page.tsx`
- ✅ `src/app/pagamento/page.tsx`
- ✅ `src/app/checkout/page.tsx`
- ✅ `src/app/carrinho/page.jsx`
- ✅ `src/components/ReviewForm/index.tsx`
- ✅ `src/components/CookieExample/index.tsx`
- ✅ `src/components/AccessibilityWidget/index.tsx`
- ✅ `src/app/adm/produto/adicionar/page.tsx`
- ✅ `src/app/adm/produto/alterar/[id]/page.tsx`
- ✅ `src/app/adm/produto/gerenciarProdutos/page.tsx`
- ✅ `src/app/adm/pedidos/page.tsx`
- ✅ `src/app/adm/carousel/page.tsx`
- ✅ `src/app/adm/administrador/adicionar/page.tsx`
- ✅ `src/app/adm/administrador/alterar/[id]/page.tsx`
- ✅ `src/app/adm/administrador/gerenciarAdministradores/page.tsx`
- ✅ `src/app/adm/avaliacoes/page.tsx`

---

**Desenvolvido para Hall of Jerseys** 🏀 🏈 🏒 ⚽
