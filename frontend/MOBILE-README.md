# Implementação Mobile - SB Engenharia

## Componentes Criados

### 1. `MobileSidebar.tsx`
Menu lateral responsivo para dispositivos móveis com:
- Header fixo no topo com botão hambúrguer
- Drawer que desliza da esquerda
- Overlay para fechar ao clicar fora
- Navegação completa igual ao desktop

### 2. `MobileDashboardLayout.tsx`
Layout que combina:
- Sidebar desktop (sempre visível em telas grandes)
- MobileSidebar (apenas em telas pequenas)
- Padding superior automático no mobile para o header fixo

### 3. `useIsMobile.ts`
Hook personalizado para detectar tamanho de tela.

## Como Implementar

### Opção 1: Substituir o Layout atual (recomendado)

Edite `src/routes.tsx` e troque:
```tsx
import DashboardLayout from "./components/Layouts/DashboardLayout";
```

Por:
```tsx
import MobileDashboardLayout from "./components/Layouts/MobileDashboardLayout";
```

E mude:
```tsx
element: <DashboardLayout />,
```

Para:
```tsx
element: <MobileDashboardLayout />,
```

### Opção 2: Usar ambos os layouts

Mantenha o `DashboardLayout` atual e use o `MobileDashboardLayout` quando precisar de responsividade mobile.

## Funcionalidades Mobile

- **Header fixo**: Sempre visível no topo com título e botão de menu
- **Menu hambúrguer**: Abre o drawer lateral
- **Overlay escuro**: Fecha o menu ao clicar fora
- **Transições suaves**: Animação ao abrir/fechar
- **Área de scroll**: Conteúdo do menu rolável independente
- **Footer com perfil**: Sempre visível no final do drawer

## Testes

Para testar o layout mobile:

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Abra o DevTools do navegador (F12)
3. Ative o modo de visualização de dispositivos (Ctrl+Shift+M)
4. Selecione um dispositivo mobile (iPhone, Android, etc.)

## Personalização

O componente mobile usa as mesmas cores e estilos do Tailwind configurados no projeto. As navegações (`adm-items.ts` e `eng-items.ts`) são reutilizadas para manter consistência.

## Arquivos Não Modificados

Seu código original permanece intacto:
- `Sidebar.tsx` ✓
- `DashboardLayout.tsx` ✓
- `adm-items.ts` ✓
- `eng-items.ts` ✓
- `routes.tsx` ✓
- `index.css` ✓
