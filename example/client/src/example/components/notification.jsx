import React from 'react'
import {connect} from 'react-redux'

import Table from 'grommet/components/Table'
import TableRow from 'grommet/components/TableRow'

import {overpassNotification} from '../../overpass/selectors'

export function ExampleNotification (props) {
  const {notification} = props
  let row

  if (notification) {
    const {type, payload} = notification

    row = <TableRow>
      <td>{type}</td>
      <td>{JSON.stringify(payload)}</td>
    </TableRow>
  } else {
    row = <TableRow>
      <td><em>(none)</em></td>
      <td><em>(none)</em></td>
    </TableRow>
  }

  return <Table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Payload</th>
      </tr>
    </thead>

    <tbody>{row}</tbody>
  </Table>
}

export default connect(
    function mapStateToProps (state) {
      return {
        notification: overpassNotification(state)
      }
    }
)(ExampleNotification)
