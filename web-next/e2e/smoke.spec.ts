import { expect, test } from "@playwright/test";

test("public catalog smoke", async ({ page, request }) => {
  const categoriasResponse = await request.get("/api/categorias");
  expect(categoriasResponse.ok()).toBeTruthy();
  const categoriasJson = (await categoriasResponse.json()) as unknown[];
  expect(Array.isArray(categoriasJson)).toBeTruthy();
  expect(categoriasJson.length).toBeGreaterThan(0);

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Muebles a tu medida con el sello de Carpinter[íi]a S[áa]nchez/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  const categoriaLink = page.locator('a[href^="/categoria/"]').first();
  await expect(categoriaLink).toBeVisible();
  await categoriaLink.click();

  await expect(page).toHaveURL(/\/categoria\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const productoLink = page.locator('a[href^="/producto/"]').first();
  await expect(productoLink).toBeVisible();
});

test("order API creates pedido and detail page renders", async ({ page, request }) => {
  const productosResponse = await request.get("/api/productos");
  expect(productosResponse.ok()).toBeTruthy();

  const productos = (await productosResponse.json()) as Array<{ id: string }>;
  expect(productos.length).toBeGreaterThan(0);

  const createPedidoResponse = await request.post("/api/pedidos", {
    data: {
      customer: {
        nombreDestinatario: "Cliente E2E",
        email: "cliente.e2e@example.com",
        telefono: "5551234567",
        direccion: "Calle Falsa 123",
        ciudad: "Tlaxcala",
        codigoPostal: "90000",
        referencia: "Puerta azul",
      },
      metodoPago: "ticket_tienda",
      items: [{ id: productos[0].id, quantity: 1 }],
    },
  });

  expect(createPedidoResponse.status()).toBe(201);
  const pedido = (await createPedidoResponse.json()) as { id: string };
  expect(pedido.id).toBeTruthy();

  await page.goto(`/pedido/${pedido.id}?creado=1`);
  await expect(page.getByRole("heading", { name: new RegExp(`Pedido ${pedido.id}`) })).toBeVisible();
  await expect(page.getByText(/Pedido confirmado/i)).toBeVisible();
});
