import {
  Body,
  Button,
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

export interface DownloadItem {
  productName: string;
  productImage?: string;
}

export interface DownloadReadyEmailProps {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  items: DownloadItem[];
  downloadUrl: string;
}

export const DownloadReadyEmail = ({
  customerName,
  orderId,
  items,
  downloadUrl,
}: DownloadReadyEmailProps) => {
  return (
    <Html lang="es">
      <Head />
      <Preview>¡Tu pedido #{orderId} está listo para descargar!</Preview>
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
                ¡Tus cómics están listos!
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-4">
                {customerName ? `Hola ${customerName},` : "Hola,"}
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-4">
                Tu pedido ha sido procesado y tus cómics digitales ya están
                disponibles para descarga. Haz clic en los enlaces de abajo para
                descargar cada cómic.
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-0">
                El enlace de descarga estará activos durante{" "}
                <strong>24 horas</strong> a partir de que recibas este correo.
                Te recomendamos descargar tus cómics lo antes posible.
              </Text>
            </Section>

            {/* Order Details */}
            <Section className="bg-white py-6 px-6 rounded-lg">
              <Heading className="text-slate-800 text-lg font-bold mb-4 mt-0 leading-6">
                Detalles del Pedido
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                <strong>Referencia:</strong> {orderId}
              </Text>
            </Section>

            {/* Comics List */}
            <Section className="bg-white rounded-lg overflow-hidden p-0">
              <Section className="bg-red-600 text-white py-4 px-6">
                <Heading className="text-white text-lg font-bold m-0 leading-6">
                  Cómics Incluidos
                </Heading>
              </Section>

              {items.map((item, index) => (
                <Row
                  key={`${item.productName}-${index}`}
                  className="border-b border-slate-200 p-0"
                >
                  <Column className="align-top py-4 px-4">
                    <Text className="text-slate-800 text-base font-semibold m-0 leading-6">
                      {item.productName}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* Download Button */}
            <Section className="text-center py-8 px-6">
              <Button
                href={downloadUrl}
                className="bg-red-600 text-white py-4 px-8 rounded-lg font-bold text-lg inline-block no-underline"
                style={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  padding: "16px 32px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "18px",
                  textDecoration: "none",
                  display: "inline-block",
                  boxShadow: "0 4px 15px rgba(220, 38, 38, 0.3)",
                }}
              >
                🔽 Descargar Cómics (ZIP)
              </Button>
            </Section>

            {/* Important Notice */}
            <Section className="bg-blue-50 border border-blue-200 rounded-lg py-4 px-6">
              <Text className="text-blue-600 text-sm leading-6 mb-2 font-semibold">
                ⚠️ Información Importante
              </Text>
              <Text className="text-blue-500 text-sm leading-6 mb-2">
                • Los enlaces de descarga son únicos y personales para tu pedido
              </Text>
              <Text className="text-blue-500 text-sm leading-6 mb-2">
                • No compartas estos enlaces con terceros
              </Text>
              <Text className="text-blue-500 text-sm leading-6 mb-0">
                • Si tienes problemas con la descarga, responde a este correo
              </Text>
            </Section>

            {/* Footer */}
            <Section className="text-center py-8 px-6 border-t border-slate-200 bg-white">
              <Text className="text-sm text-slate-600 leading-6 mb-4">
                Si tienes alguna pregunta o problema con las descargas, no dudes
                en contactarnos. Estamos aquí para ayudarte.
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

export default DownloadReadyEmail;
