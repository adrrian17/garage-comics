import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface OrderItem {
  productName: string;
  productImage?: string;
  amount: number;
}

export interface OrderConfirmationEmailProps {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
}

function getPaymentMethodName(paymentMethod: string): string {
  const methodNames: Record<string, string> = {
    card: "Tarjeta de crédito/débito",
    oxxo: "OXXO",
  };
  return methodNames[paymentMethod] || paymentMethod;
}

export const OrderConfirmationEmail = ({
  customerEmail,
  customerName,
  orderId,
  items,
  total,
  paymentMethod,
}: OrderConfirmationEmailProps) => {
  return (
    <Html lang="es">
      <Head />
      <Preview>¡Tu pedido #{orderId} ha sido confirmado!</Preview>
      <Tailwind>
        <Body className="bg-slate-100 font-sans m-0 p-0 w-full">
          <Container className="max-w-2xl mx-auto bg-white p-0">
            {/* Header */}
            <Section className="text-center pt-8 pb-6 px-6 border-b-4 border-red-600 bg-white">
              <Img
                src="https://garagecomics.mx/_astro/logo.BU2cr8N9.png"
                alt="Garage Comics Logo"
                width={200}
                height={80}
                className="mx-auto mb-2"
              />
            </Section>

            {/* Main Content */}
            <Section className="bg-slate-50 py-8 px-6">
              <Heading className="text-slate-800 text-2xl font-bold mb-4 mt-0 leading-7">
                ¡Gracias por tu pedido!
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-4">
                {customerName ? `Hola ${customerName},` : "Hola,"}
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-4">
                Hemos recibido tu pedido y lo estamos procesando. Te enviaremos
                otro correo cuando tus cómics estén listos para descargarse.
              </Text>
            </Section>

            {/* Order Details */}
            <Section className="bg-white py-6 px-6 rounded-lg">
              <Heading className="text-slate-800 text-lg font-bold mb-4 mt-0 leading-6">
                Detalles del Pedido
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                <strong>Referencia de pedido:</strong> {orderId}
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                <strong>Método de pago:</strong>{" "}
                {getPaymentMethodName(paymentMethod)}
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-0">
                <strong>Email:</strong> {customerEmail}
              </Text>
            </Section>

            {/* Order Items */}
            <Section className="bg-white rounded-lg overflow-hidden p-0">
              <Section className="bg-red-600 text-white py-4 px-6">
                <Heading className="text-white text-lg font-bold m-0 leading-6">
                  Productos
                </Heading>
              </Section>

              {items.map((item) => (
                <Row
                  key={`${item.productName}-${item.amount}`}
                  className="border-b border-slate-200 p-0"
                >
                  <Column className="w-20 align-top py-4 pl-6 pr-0">
                    {item.productImage && (
                      <Img
                        src={item.productImage}
                        alt={item.productName}
                        width={60}
                        height={80}
                        className="rounded-md block object-cover"
                      />
                    )}
                  </Column>
                  <Column className="align-top py-4 px-4">
                    <Text className="text-slate-800 text-base font-semibold m-0 leading-6">
                      {item.productName}
                    </Text>
                  </Column>
                  <Column className="text-right align-top w-30 py-4 pr-6 pl-0">
                    <Text className="text-slate-800 text-base font-semibold m-0 leading-6">
                      ${(item.amount / 100).toFixed(2)} MXN
                    </Text>
                  </Column>
                </Row>
              ))}

              <Row className="border-t-2 border-red-600 bg-slate-50 p-0">
                <Column className="py-5 px-6 w-20"></Column>
                <Column className="text-right py-5 px-4">
                  <Text className="text-slate-800 text-lg font-bold m-0 leading-6">
                    Total:
                  </Text>
                </Column>
                <Column className="text-right w-30 py-5 pr-6 pl-0">
                  <Text className="text-red-600 text-lg font-bold m-0 leading-6">
                    ${(total / 100).toFixed(2)} MXN
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Footer */}
            <Section className="text-center py-8 px-6 border-t border-slate-200 bg-white">
              <Text className="text-sm text-slate-600 leading-6 mb-4">
                Si tienes alguna pregunta sobre tu pedido, no dudes en
                contactarnos.
              </Text>
              <Text className="text-sm text-slate-600 leading-6 m-0">
                <strong>Garage Comics</strong>
                <br />
                hola@garagecomics.mx
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmationEmail;
