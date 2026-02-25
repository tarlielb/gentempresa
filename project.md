Project: Dashboard de Performance de Disparos - Autta.IA

1. Visão Geral
   Desenvolvimento de uma interface de visualização em tempo real utilizando Antigraviti conectada ao Supabase. O objetivo é monitorar a saúde e os resultados das automações de e-mail e disparos geridas pelo n8n.

2. Escopo de Dados (Métricas Principais)
   O dashboard deve consolidar e exibir quatro KPIs fundamentais:

Total de E-mails Enviados: Volume bruto de saída.

Total de E-mails Abertos: Taxa de engajamento inicial.

Total de Disparos Realizados: Contagem de execuções da automação.

Total de Respostas: Volume de leads qualificados/interessados.

3. Arquitetura de Conexão
   Para garantir o Real-Time, utilizaremos a conexão direta do Antigraviti com as tabelas do Supabase via PostgreSQL ou REST API.

Tabelas Referenciadas (Supabase):
logs_disparos: Registros de cada tentativa de envio.

eventos_email: Tracking de abertos (opened) e enviados (sent).

respostas_leads: Registro de entradas via webhook ou integração de e-mail.

4. Requisitos de Interface (UI)
   Layout: Grid limpo com 4 "Cards" de destaque no topo para as métricas principais.

Gráfico de Tendência: Um gráfico de linhas simples mostrando o volume de disparos vs. respostas nos últimos 7 dias.

Atualização: Configurar o intervalo de polling ou real-time subscription do Antigraviti para refletir mudanças instantâneas no banco.
