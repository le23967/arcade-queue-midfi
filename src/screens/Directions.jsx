import { Modal, SecondaryButton } from '../components/ui.jsx'

/* Directions hand-off.

   The Maps tab used to sit here: the same three venues, the same wait times,
   plotted on a gray rectangle. It duplicated the list and answered nothing the
   list did not already answer.

   Handing off is also the better product decision. Players choose a venue while
   they are already moving - "usually just when I get on the bus", "as I'm on
   the way to the city" - so at the moment they need directions they need live
   transit and traffic, which the phone's own maps app does properly. This app's
   job is deciding WHICH arcade; getting there is not ours to rebuild. */
export default function Directions({ arcade, onCancel }) {
  const query = encodeURIComponent(`${arcade.name}, ${arcade.address}`)

  return (
    <Modal title={`Directions to ${arcade.short}`}>
      <p className="text-sm text-gray-900">{arcade.name}</p>
      <p className="mt-0.5 text-xs text-gray-600">{arcade.address}</p>
      <p className="mt-0.5 text-xs tabular-nums text-gray-600">
        {arcade.distanceKm.toFixed(1)} km away
      </p>

      <div className="mt-4 space-y-2">
        <a
          href={`https://maps.apple.com/?q=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-md border border-gray-400 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900"
        >
          Open in Apple Maps
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-md border border-gray-400 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900"
        >
          Open in Google Maps
        </a>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </div>
    </Modal>
  )
}
