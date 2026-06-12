import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callMethod } from '../client';
import type { ExtractionSchema, IntakePayload, IntakeResult } from '../types';

/** The document→field map (field_map.json) that drives the intake form sections. */
export function useExtractionSchema() {
  return useQuery<ExtractionSchema>({
    queryKey: ['extraction-schema'],
    queryFn: () =>
      callMethod<ExtractionSchema>(
        'buildsupply.import_tracking.extraction.extract.get_extraction_schema',
      ),
    staleTime: Infinity, // schema only changes with a deploy
  });
}

/** Create/update an Import Shipment from the intake payload; server recomputes totals. */
export function useApplyIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, shipment }: { payload: IntakePayload; shipment?: string }) =>
      callMethod<IntakeResult>(
        'buildsupply.import_tracking.extraction.extract.apply_extracted_payload',
        { payload: JSON.stringify(payload), shipment },
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['import-shipments'] });
      if (res?.shipment) qc.invalidateQueries({ queryKey: ['import-shipment', res.shipment] });
    },
  });
}
